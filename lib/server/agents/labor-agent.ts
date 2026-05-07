import { laborAgentResponseSchema, LaborAgentResult } from "@/lib/schemas";
import type { LaborTopic } from "@/lib/schemas";
import { LaborKnowledgeClient } from "./knowledge/local/labor-knowledge-client";
import { McpKnowledgeClient } from "./knowledge/mcp/mcp-knowledge-client";
import { BaseAgent } from "./base-agent";
import { ClaudeToolDefinition } from "./claude-client";

const LABOR_TOOL: ClaudeToolDefinition = {
  name: "emit_labor_guidance",
  description:
    "Emit a structured labor guidance response for a Chilean microenterprise. Explain concepts, never calculate exact salaries or percentages, never give legal advice.",
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
        description: "Uno de: hiring, contract, salary, payroll, previred, working_hours, honorarios_vs_employee, general",
      },
      requirements: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            applies_if: { type: "string" },
            institution: { type: "string" },
            status_hint: { type: "string", enum: ["required", "conditional", "informational"] },
          },
          required: ["title", "description", "status_hint"],
        },
        description: "Requisitos o pasos para completar la contratacion o tramite",
      },
      assumptions: {
        type: "array",
        items: { type: "string" },
        description: "Supuestos sobre los que se basa la respuesta",
      },
      missing_context: {
        type: "array",
        items: { type: "string" },
        description: "Datos que faltan para responder con mas precision",
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
    required: ["message", "topic", "confidence"],
  },
};

const VALID_TOPICS: LaborTopic[] = [
  "hiring", "contract", "salary", "payroll",
  "previred", "working_hours", "honorarios_vs_employee", "general",
];

function sanitizeTopic(raw: string): LaborTopic {
  const lower = raw.toLowerCase().trim();
  if (VALID_TOPICS.includes(lower as LaborTopic)) return lower as LaborTopic;
  if (lower.includes("contratar") || lower.includes("necesito para") && lower.includes("trabajador")) return "hiring";
  if (lower.includes("contrato") || lower.includes("plazo fijo") || lower.includes("indefinido")) return "contract";
  if (lower.includes("sueldo") || lower.includes("salario") || lower.includes("liquido") || lower.includes("bruto") || lower.includes("calcula")) return "salary";
  if (lower.includes("liquidacion")) return "payroll";
  if (lower.includes("previred") || lower.includes("cotizacion") || lower.includes("imposicion") || lower.includes("afp") || lower.includes("fonasa")) return "previred";
  if (lower.includes("jornada") || lower.includes("hora")) return "working_hours";
  if (lower.includes("honorario") || lower.includes("dependiente") || lower.includes("boleta honorario")) return "honorarios_vs_employee";
  return "general";
}

function buildSystemPrompt(knowledgeContent: string): string {
  return `Eres un asistente de orientacion laboral para microempresas chilenas. Tu rol es educativo. No haces calculos ni das asesoria legal definitiva.

CONOCIMIENTO CONTEXTUAL:
${knowledgeContent}

REGLAS:
1. No das asesoria legal definitiva. Explicas conceptos, no redactas contratos.
2. NUNCA calcules sueldo liquido exacto ni porcentajes de cotizaciones (AFP, salud, cesantia).
3. NUNCA des fechas exactas de pago de cotizaciones ni plazos legales fijos.
4. NO afirmes numeros especificos de horas de jornada. Indica que la jornada debe respetar limites legales vigentes segun la Direccion del Trabajo.
5. Si el usuario pide un calculo ("calcula sueldo liquido de 500000"), explicale los conceptos (bruto, descuentos, liquido) y recomienda consultar con un contador o usar calculadoras de Previred.
6. Si el usuario menciona honorarios, explica la diferencia con relacion laboral. Si hay subordinacion o dependencia, podria existir vinculo laboral. NO recomiendes honorarios como sustituto.
7. Usa lenguaje claro y simple. Texto plano con saltos de linea. NO uses markdown, negritas ni caracteres especiales.
8. Siempre recomienda verificar en Direccion del Trabajo, Previred y con un contador.

Debes invocar obligatoriamente la herramienta emit_labor_guidance.`;
}

function normalizeLaborResult(
  raw: Record<string, unknown>
): LaborAgentResult {
  const message = String(raw.message || "Entiendo tu consulta sobre temas laborales. Cuentame mas para orientarte mejor.");
  const topic = sanitizeTopic(String(raw.topic || "general"));
  const confidence = typeof raw.confidence === "number" ? raw.confidence : 0.7;

  const requirements = Array.isArray(raw.requirements)
    ? (raw.requirements as Array<Record<string, unknown>>).map((r) => ({
        title: String(r.title || ""),
        description: String(r.description || ""),
        applies_if: r.applies_if ? String(r.applies_if) : undefined,
        institution: r.institution ? String(r.institution) : undefined,
        status_hint: (
          ["required", "conditional", "informational"].includes(String(r.status_hint))
            ? String(r.status_hint)
            : "informational"
        ) as "required" | "conditional" | "informational",
      }))
    : [];

  const assumptions = Array.isArray(raw.assumptions) ? raw.assumptions as string[] : [];
  const missingContext = Array.isArray(raw.missing_context) ? raw.missing_context as string[] : [];
  const nextSteps = Array.isArray(raw.next_steps) ? raw.next_steps as string[] : [];

  return {
    agent: "labor",
    message,
    topic,
    requirements,
    assumptions,
    missing_context: missingContext,
    next_steps: nextSteps,
    sources: [
      { name: "Direccion del Trabajo" },
      { name: "Previred" },
      { name: "Copiloto Pyme" },
    ],
    confidence,
    model_used: "claude",
    warnings: [],
  };
}

function detectTopic(inputText: string): LaborTopic {
  const lower = inputText.toLowerCase();
  if (lower.includes("honorario") || lower.includes("boleta honorario") || lower.includes("dependiente")) return "honorarios_vs_employee";
  if (lower.includes("calcula") || lower.includes("liquido") || lower.includes("bruto") || lower.includes("sueldo")) return "salary";
  if (lower.includes("previred") || lower.includes("cotizacion") || lower.includes("imposicion") || lower.includes("afp") || lower.includes("fonasa") || lower.includes("isapre")) return "previred";
  if (lower.includes("jornada") || lower.includes("hora")) return "working_hours";
  if (lower.includes("liquidacion")) return "payroll";
  if (lower.includes("contratar") || lower.includes("necesito para contratar") || lower.includes("quiero contratar")) return "hiring";
  if (lower.includes("contrato") || lower.includes("plazo fijo") || lower.includes("indefinido")) return "contract";
  return "general";
}

function buildFallbackResult(inputText: string): LaborAgentResult {
  const topic = detectTopic(inputText);

  const topicMessages: Record<string, string> = {
    hiring: "Para contratar a un trabajador necesitas los siguientes datos:\n\nDel trabajador: nombre completo, RUT, fecha de nacimiento, domicilio, nacionalidad.\n\nDe la empresa: RUT, razon social, direccion comercial.\n\nDel contrato: tipo (plazo fijo, indefinido u obra), fecha de inicio, cargo, jornada dentro de limites legales vigentes, sueldo bruto acordado, lugar de trabajo.\n\nEl trabajador debe informar su AFP elegida y sistema de salud (FONASA o ISAPRE).\n\nVerifica siempre los requisitos actualizados en la Direccion del Trabajo.",
    contract: "El contrato de trabajo debe ser por escrito y firmado por ambas partes. Debe incluir: identificacion de las partes, fecha de inicio, cargo, sueldo bruto, jornada, lugar de trabajo, tipo de contrato y duracion si es plazo fijo.\n\nTipos de contrato: plazo fijo (con fecha de termino), indefinido (sin fecha de termino), por obra o faena (dura lo que dure la obra).\n\nVerifica los requisitos en la Direccion del Trabajo.",
    salary: "No calculo sueldos liquidos exactos. Los conceptos son:\n\nSueldo bruto: monto acordado antes de descuentos.\n\nDescuentos legales obligatorios: cotizacion previsional (AFP), salud (FONASA o ISAPRE) y seguro de cesantia.\n\nSueldo liquido: lo que recibe el trabajador despues de los descuentos.\n\nLos porcentajes exactos dependen de la AFP elegida, el sistema de salud y las condiciones personales. Te recomiendo consultar con un contador o usar calculadoras oficiales de Previred.",
    payroll: "La liquidacion de sueldo es el documento mensual que detalla todos los conceptos: sueldo bruto, descuentos legales, otros descuentos, sueldo liquido. Debe entregarse al trabajador cada mes.\n\nEl formato y contenidos minimos estan definidos por la Direccion del Trabajo. No calculo liquidaciones exactas, pero puedo explicarte los conceptos que la componen.",
    previred: "Previred es el sistema de declaracion y pago de cotizaciones previsionales. Aplica SOLO si tienes trabajadores dependientes contratados.\n\nIncluye: AFP, salud y seguro de cesantia. La declaracion es mensual segun el calendario de Previred.\n\nSi no tienes trabajadores, Previred no aplica. Al contratar por primera vez, debes inscribirte como empleador en Previred.\n\nVerifica fechas y porcentajes exactos en Previred.",
    working_hours: "La jornada laboral debe respetar los limites legales vigentes segun la Direccion del Trabajo. Existen jornadas ordinarias, parciales y extraordinarias.\n\nLas horas extraordinarias deben pactarse y pagarse con recargo. Los limites de jornada y descanso estan en el Codigo del Trabajo.\n\nPara conocer los limites especificos vigentes, consulta la Direccion del Trabajo.",
    honorarios_vs_employee: "Diferencia clave:\n\nTrabajador dependiente: tiene contrato de trabajo, recibe sueldo, el empleador paga cotizaciones.\n\nHonorarios: la persona emite boleta de honorarios, no hay relacion laboral formal, no hay cotizaciones pagadas por quien contrata.\n\nImportante: si hay subordinacion, dependencia, horario fijo y jefatura directa, podria existir una relacion laboral aunque se emitan boletas. Te sugiero verificar con la Direccion del Trabajo.",
    general: "Puedo orientarte sobre contratacion, sueldos, contratos, jornada laboral, Previred y la diferencia entre honorarios y trabajador dependiente. Preguntame lo que necesites. Recuerda verificar siempre en la Direccion del Trabajo y con un contador.",
  };

  return {
    agent: "labor",
    message: topicMessages[topic] || topicMessages.general,
    topic,
    requirements: topic === "hiring"
      ? [
          { title: "Datos del trabajador", description: "Nombre completo, RUT, fecha de nacimiento, domicilio", status_hint: "required" },
          { title: "Tipo de contrato", description: "Plazo fijo, indefinido o por obra", status_hint: "required" },
          { title: "Fecha de inicio de labores", description: "Dia en que el trabajador comienza", status_hint: "required" },
          { title: "Cargo o funcion", description: "Que labor desempenara", status_hint: "required" },
          { title: "Sueldo bruto acordado", description: "Monto antes de descuentos legales", status_hint: "required" },
          { title: "Jornada laboral", description: "Dentro de los limites legales vigentes", status_hint: "required" },
          { title: "AFP elegida por el trabajador", description: "El trabajador informa cual AFP eligio", status_hint: "conditional" },
          { title: "Sistema de salud", description: "FONASA o ISAPRE segun eleccion del trabajador", status_hint: "conditional" },
          { title: "Datos de la empresa", description: "RUT, razon social, direccion comercial", status_hint: "required" },
        ]
      : [],
    assumptions: ["El usuario es una microempresa chilena que quiere contratar o entender obligaciones laborales."],
    missing_context: topic === "hiring" ? ["Tipo de contrato deseado", "Cargo del trabajador", "Sueldo bruto aproximado"] : [],
    next_steps: [
      "Verifica los requisitos actualizados en la Direccion del Trabajo",
      "Si necesitas calcular cotizaciones, usa las herramientas de Previred",
      "Consulta con un contador para casos especificos",
    ],
    sources: [
      { name: "Direccion del Trabajo" },
      { name: "Previred" },
      { name: "Copiloto Pyme" },
    ],
    confidence: 0.85,
    model_used: "fallback-deterministic",
    warnings: ["Claude no disponible o salida invalida; se uso fallback deterministico."],
  };
}

export class LaborAgent extends BaseAgent<LaborAgentResult> {
  protected readonly name = "labor" as const;
  protected readonly domain = "gestion laboral y contratacion";
  protected readonly capabilities = [
    { name: "hiring_guidance", description: "Guia para contratacion de trabajadores" },
    { name: "contract_requirements", description: "Requisitos de contrato de trabajo" },
    { name: "payroll_explanation", description: "Explica sueldos y liquidaciones" },
    { name: "previred_explanation", description: "Explica Previred y cotizaciones" },
    { name: "honorarios_vs_employee", description: "Diferencia honorarios vs dependiente" },
  ];
  protected readonly knowledgeClient = new McpKnowledgeClient({
    serverUrl: process.env.MCP_LABOR_URL,
    searchToolName: "search_labor_knowledge",
    sourceName: "MCP Labor",
    fallbackClient: new LaborKnowledgeClient(),
  });

  protected buildTool(): ClaudeToolDefinition {
    return LABOR_TOOL;
  }

  protected buildSystemPrompt(knowledge: { content: string }) {
    return buildSystemPrompt(knowledge.content);
  }

  protected normalizeResult(raw: Record<string, unknown>, _inputText: string): LaborAgentResult {
    return normalizeLaborResult(raw);
  }

  protected getOutputSchema() {
    return laborAgentResponseSchema;
  }

  protected async persist(): Promise<void> {}

  protected buildFallbackResult(inputText: string): LaborAgentResult {
    return buildFallbackResult(inputText);
  }
}
