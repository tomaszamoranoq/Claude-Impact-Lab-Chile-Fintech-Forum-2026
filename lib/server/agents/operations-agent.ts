import { operationsResponseSchema, OperationsAgentResult } from "@/lib/schemas";
import type { OperationsTopic } from "@/lib/schemas";
import { OperationsKnowledgeClient } from "./knowledge/local/operations-knowledge-client";
import { BaseAgent } from "./base-agent";
import { ClaudeToolDefinition } from "./claude-client";
import { AgentContext } from "./types";
import { getCashTransactionSummary, CashTransactionSummary } from "@/lib/server/store";

const OPERATIONS_TOOL: ClaudeToolDefinition = {
  name: "emit_operations_response",
  description:
    "Emit a structured operations response for a Chilean microenterprise. Explain concepts, read balances, suggest categories, but never calculate taxes or write transactions.",
  input_schema: {
    type: "object" as const,
    properties: {
      message: {
        type: "string",
        description:
          "Respuesta principal en espanol, clara y simple. Texto plano con frases cortas separadas por saltos de linea. No uses markdown, negritas ni caracteres especiales.",
      },
      topic: {
        type: "string",
        description: "Uno de: cashbook, balance, expenses, income, invoice_payment, categorization, missing_amount, general",
      },
      insights: {
        type: "array",
        items: { type: "string" },
        description: "Observaciones o analisis breves sobre los datos de caja",
      },
      suggested_categories: {
        type: "array",
        items: { type: "string" },
        description: "Categorias sugeridas para clasificar si el usuario necesita ayuda",
      },
      missing_context: {
        type: "array",
        items: { type: "string" },
        description: "Datos que faltan para completar la consulta del usuario",
      },
      next_steps: {
        type: "array",
        items: { type: "string" },
        description: "Proximos pasos sugeridos",
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
      },
    },
    required: ["message", "topic", "insights", "confidence"],
  },
};

const VALID_TOPICS: OperationsTopic[] = [
  "cashbook", "balance", "expenses", "income",
  "invoice_payment", "categorization", "missing_amount", "general",
];

function sanitizeTopic(raw: string): OperationsTopic {
  const lower = raw.toLowerCase().trim();
  if (VALID_TOPICS.includes(lower as OperationsTopic)) return lower as OperationsTopic;
  if (lower.includes("cashbook") || lower.includes("libro")) return "cashbook";
  if (lower.includes("balance") || lower.includes("saldo")) return "balance";
  if (lower.includes("expense") || lower.includes("egreso") || lower.includes("gast")) return "expenses";
  if (lower.includes("income") || lower.includes("ingreso") || lower.includes("venta")) return "income";
  if (lower.includes("invoice") || lower.includes("factura") || lower.includes("pago")) return "invoice_payment";
  if (lower.includes("categor")) return "categorization";
  if (lower.includes("missing") || lower.includes("falta") || lower.includes("monto")) return "missing_amount";
  return "general";
}

function buildSystemPrompt(knowledgeContent: string): string {
  return `Eres un asistente de operaciones de caja para microempresas chilenas. Tu rol es educativo y analitico. No registras transacciones.

CONOCIMIENTO CONTEXTUAL:
${knowledgeContent}

REGLAS:
1. No das asesoria tributaria definitiva. Explicas conceptos operativos.
2. NO calcules IVA, impuestos ni retenciones.
3. NUNCA escribas transacciones en caja. Solo lees y explicas.
4. Si el usuario quiere registrar algo y faltan datos, pide monto, categoria, fecha y descripcion.
5. Sugiere al usuario escribir frases como "pague arriendo por 500000" para que el sistema detecte la accion.
6. Usa lenguaje claro y simple. Texto plano con saltos de linea. NO uses markdown, negritas ni caracteres especiales.
7. Si tienes acceso a datos reales de caja en el contexto, usalos para responder con precision.
8. Si no tienes datos de caja, explicalo y responde en modo educativo.

Debes invocar obligatoriamente la herramienta emit_operations_response.`;
}

function normalizeOperationsResult(
  raw: Record<string, unknown>,
  summary?: CashTransactionSummary
): OperationsAgentResult {
  const message = String(raw.message || "Entiendo tu consulta sobre operaciones de caja.");
  const topic = sanitizeTopic(String(raw.topic || "general"));
  const insights = Array.isArray(raw.insights) ? raw.insights as string[] : [];
  const suggestedCategories = Array.isArray(raw.suggested_categories)
    ? raw.suggested_categories as string[]
    : [];
  const missingContext = Array.isArray(raw.missing_context)
    ? raw.missing_context as string[]
    : [];
  const nextSteps = Array.isArray(raw.next_steps)
    ? raw.next_steps as string[]
    : [];
  const confidence = typeof raw.confidence === "number" ? raw.confidence : 0.7;

  const enrichedMessage = maybeAppendSummaryBlock(message, topic, summary);

  const summaryPayload = summary ? {
    current_balance: summary.currentBalance,
    monthly_income: summary.monthlyIncome,
    monthly_expenses: summary.monthlyExpenses,
    transaction_count: summary.transactionCount,
    last_transactions: summary.lastTransactions.map((t) => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date,
    })),
    top_categories: summary.topCategories.map((c) => ({
      category: c.category,
      count: c.count,
      total: c.total,
    })),
  } : undefined;

  return {
    agent: "operations",
    message: enrichedMessage,
    topic,
    summary: summaryPayload,
    insights,
    suggested_categories: suggestedCategories,
    missing_context: missingContext,
    next_steps: nextSteps,
    confidence,
    model_used: "claude",
    warnings: [],
  };
}

function detectTopic(inputText: string): OperationsTopic {
  const lower = inputText.toLowerCase();
  if (lower.includes("libro") || lower.includes("como registro") || lower.includes("como funciona")) return "cashbook";
  if (lower.includes("saldo") || lower.includes("cuanto he") || lower.includes("balance") || lower.includes("cuanto tengo")) return "balance";
  if (lower.includes("egreso") || lower.includes("gasto") || lower.includes("gastado") || lower.includes("ultimos egresos")) return "expenses";
  if (lower.includes("ingreso") || lower.includes("venta") || lower.includes("cobre")) return "income";
  if (lower.includes("factura") || lower.includes("pagado") || lower.includes("pago") || lower.includes("diferencia")) return "invoice_payment";
  if (lower.includes("categoria") || lower.includes("clasificar") || lower.includes("ordenar")) return "categorization";
  if (lower.includes("registr") || lower.includes("compre") || lower.includes("pero no")) return "missing_amount";
  return "general";
}

function formatSummaryForPrompt(summary: CashTransactionSummary): string {
  const lines: string[] = [];
  lines.push(`Saldo actual: $${summary.currentBalance.toLocaleString("es-CL")}`);
  lines.push(`Ingresos del periodo: $${summary.monthlyIncome.toLocaleString("es-CL")}`);
  lines.push(`Egresos del periodo: $${summary.monthlyExpenses.toLocaleString("es-CL")}`);
  lines.push(`Total de transacciones: ${summary.transactionCount}`);

  if (summary.topCategories.length > 0) {
    lines.push("Categorias mas usadas:");
    for (const c of summary.topCategories) {
      const sign = c.total >= 0 ? "+" : "";
      lines.push(`  - ${c.category}: ${sign}$${Math.abs(c.total).toLocaleString("es-CL")} (${c.count} transacciones)`);
    }
  }

  if (summary.lastTransactions.length > 0) {
    lines.push("Ultimas transacciones:");
    for (const t of summary.lastTransactions) {
      const sign = t.type === "income" ? "+" : "-";
      lines.push(`  ${t.date} ${t.type === "income" ? "Ingreso" : "Egreso"} ${t.category} ${sign}$${t.amount.toLocaleString("es-CL")} ${t.description}`);
    }
  }

  return `Resumen financiero:\n${lines.join("\n")}`;
}

function buildSummaryBlock(topic: OperationsTopic, summary: CashTransactionSummary): string {
  const block: string[] = [];
  block.push("Resumen de caja:");
  block.push(`Saldo actual: $${summary.currentBalance.toLocaleString("es-CL")}`);
  block.push(`Ingresos del periodo: $${summary.monthlyIncome.toLocaleString("es-CL")}`);
  block.push(`Egresos del periodo: $${summary.monthlyExpenses.toLocaleString("es-CL")}`);
  block.push(`Transacciones consideradas: ${summary.transactionCount}`);

  if (topic === "expenses" || topic === "balance") {
    const expenses = summary.lastTransactions.filter((t) => t.type === "expense").slice(0, 3);
    if (expenses.length > 0) {
      block.push("Ultimos egresos:");
      for (const t of expenses) {
        block.push(`  ${t.date} ${t.category} $${t.amount.toLocaleString("es-CL")} ${t.description}`);
      }
    }
  }

  if (topic === "income" || topic === "balance") {
    const incomes = summary.lastTransactions.filter((t) => t.type === "income").slice(0, 3);
    if (incomes.length > 0) {
      block.push("Ultimos ingresos:");
      for (const t of incomes) {
        block.push(`  ${t.date} ${t.category} $${t.amount.toLocaleString("es-CL")} ${t.description}`);
      }
    }
  }

  block.push("Incluye movimientos confirmados, pendientes e inferidos. No es calculo tributario ni conciliacion bancaria.");

  return block.join("\n");
}

function maybeAppendSummaryBlock(
  message: string,
  topic: OperationsTopic,
  summary?: CashTransactionSummary
): string {
  if (!summary) return message;
  if (!["balance", "expenses", "income"].includes(topic)) return message;
  return `${message}\n\n${buildSummaryBlock(topic, summary)}`;
}

function buildFallbackResult(inputText: string, summary?: CashTransactionSummary): OperationsAgentResult {
  const topic = detectTopic(inputText);

  const topicMessages: Record<string, string> = {
    cashbook: "El libro de caja es el registro diario de tus ingresos y egresos. Debes anotar cada movimiento con monto, categoria, fecha y descripcion. No es lo mismo que una factura: la factura es un documento tributario y el libro de caja refleja el movimiento real de dinero.",
    balance: "Puedes consultar tu saldo e historial en la seccion Libro de Caja. Ahi veras todos tus ingresos, egresos y el saldo actual.",
    expenses: "Tus egresos se registran con frases como 'pague arriendo por 500000'. Puedes ver tus ultimos egresos en la seccion Libro de Caja. Las categorias comunes son Arriendo, Materias primas, Servicios y Equipamiento.",
    income: "Tus ingresos se registran con frases como 'vendi pan por 185000'. Puedes ver tus ingresos en la seccion Libro de Caja.",
    invoice_payment: "Una factura emitida no significa que hayas recibido el dinero. El libro de caja registra el movimiento real. Para saber si una factura esta pagada, revisa si hay un egreso o ingreso con el mismo monto en tu libro de caja.",
    categorization: "Las categorias te ayudan a organizar tus finanzas. Las mas comunes son: Ventas, Arriendo, Servicios, Materias primas, Equipamiento. Elige la que mejor describa cada transaccion.",
    missing_amount: "Para registrar una transaccion necesito algunos datos. Por favor indicame el monto, la categoria y la fecha. Por ejemplo: 'pague harina por 45000 el 5 de mayo'.",
    general: "Puedo ayudarte a entender tu libro de caja, consultar saldos, ver egresos e ingresos, y explicarte como clasificar tus transacciones. Preguntame lo que necesites.",
  };

  const message = summary
    ? `${topicMessages[topic] || topicMessages.general}\n\n${formatSummaryForPrompt(summary)}`
    : topicMessages[topic] || topicMessages.general;

  return {
    agent: "operations",
    message,
    topic,
    summary: summary ? {
      current_balance: summary.currentBalance,
      monthly_income: summary.monthlyIncome,
      monthly_expenses: summary.monthlyExpenses,
      transaction_count: summary.transactionCount,
      last_transactions: summary.lastTransactions.map((t) => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: t.date,
      })),
      top_categories: summary.topCategories.map((c) => ({
        category: c.category,
        count: c.count,
        total: c.total,
      })),
    } : undefined,
    insights: [],
    suggested_categories: ["Ventas", "Arriendo", "Servicios", "Materias primas", "Equipamiento"],
    missing_context: topic === "missing_amount" ? ["Monto", "Categoria", "Fecha"] : [],
    next_steps: ["Revisa tu libro de caja en la seccion correspondiente", "Para registrar un movimiento, escribelo como 'pague arriendo por 500000'"],
    confidence: 0.85,
    model_used: "fallback-deterministic",
    warnings: ["Claude no disponible o salida invalida; se uso fallback deterministico."],
  };
}

export class OperationsAgent extends BaseAgent<OperationsAgentResult> {
  protected readonly name = "operations" as const;
  protected readonly domain = "operaciones de caja";
  protected readonly capabilities = [
    { name: "cashbook_explanation", description: "Explica conceptos de libro de caja" },
    { name: "balance_query", description: "Responde consultas de saldo, ingresos y egresos" },
    { name: "categorization", description: "Sugiere categorias para clasificar transacciones" },
  ];
  protected readonly knowledgeClient = new OperationsKnowledgeClient();

  private lastSummary?: CashTransactionSummary;

  protected buildTool(): ClaudeToolDefinition {
    return OPERATIONS_TOOL;
  }

  protected buildSystemPrompt(knowledge: { content: string }) {
    return buildSystemPrompt(knowledge.content);
  }

  protected normalizeResult(raw: Record<string, unknown>, _inputText: string): OperationsAgentResult {
    return normalizeOperationsResult(raw, this.lastSummary);
  }

  protected getOutputSchema() {
    return operationsResponseSchema;
  }

  protected async persist(): Promise<void> {}

  protected buildFallbackResult(inputText: string): OperationsAgentResult {
    return buildFallbackResult(inputText, this.lastSummary);
  }

  protected async buildAdditionalContext(context: AgentContext): Promise<string> {
    try {
      this.lastSummary = await getCashTransactionSummary(context.companyId);
      return formatSummaryForPrompt(this.lastSummary);
    } catch {
      this.lastSummary = undefined;
      return "No se pudieron cargar los datos de caja. Responde en modo educativo.";
    }
  }
}
