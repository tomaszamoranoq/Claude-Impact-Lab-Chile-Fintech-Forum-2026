import { documentsAgentResponseSchema, DocumentsAgentResult } from "@/lib/schemas";
import type { DocumentsAgentTopic } from "@/lib/schemas";
import { DocumentsKnowledgeClient } from "./knowledge/local/documents-knowledge-client";
import { McpKnowledgeClient } from "./knowledge/mcp/mcp-knowledge-client";
import { BaseAgent } from "./base-agent";
import { ClaudeToolDefinition } from "./claude-client";
import { AgentContext } from "./types";
import { getDocumentSummary, DocumentSummary } from "@/lib/server/documents";

const DOCUMENTS_TOOL: ClaudeToolDefinition = {
  name: "emit_documents_response",
  description:
    "Emit a structured documents response for a Chilean microenterprise. Guide the user on uploading, organizing, analyzing and understanding document flows. Never pretend to do real OCR or image reading.",
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
        description: "Uno de: upload_guidance, document_types, document_status, analysis_flow, invoice_vs_payment, limitations, general",
      },
      accepted_file_types: {
        type: "array",
        items: { type: "string" },
        description: "Tipos de archivo aceptados",
      },
      guidance: {
        type: "array",
        items: { type: "string" },
        description: "Pasos de guia para el usuario",
      },
      limitations: {
        type: "array",
        items: { type: "string" },
        description: "Limitaciones actuales que debe conocer el usuario",
      },
      missing_context: {
        type: "array",
        items: { type: "string" },
        description: "Datos que faltan para completar la consulta",
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

const VALID_TOPICS: DocumentsAgentTopic[] = [
  "upload_guidance", "document_types", "document_status",
  "analysis_flow", "invoice_vs_payment", "limitations", "general",
];

const FOLDER_LABELS: Record<string, string> = {
  legal: "Legal",
  tributario: "Tributario",
  rrhh: "RRHH",
  operaciones: "Operaciones",
};

const STATUS_LABELS: Record<string, string> = {
  uploaded: "Subido",
  analyzed: "Analizado",
  confirmed: "Confirmado",
  rejected: "Rechazado",
  failed: "Fallido",
  pending_analysis: "Pendiente de analisis",
};

function sanitizeTopic(raw: string): DocumentsAgentTopic {
  const lower = raw.toLowerCase().trim();
  if (VALID_TOPICS.includes(lower as DocumentsAgentTopic)) return lower as DocumentsAgentTopic;
  if (lower.includes("ocr") || lower.includes("leer") || lower.includes("foto") || lower.includes("imagen") || lower.includes("vision") || lower.includes("escan")) return "limitations";
  if (lower.includes("upload") || lower.includes("subir") || lower.includes("cargar")) return "upload_guidance";
  if (lower.includes("type") || lower.includes("tipo") || lower.includes("formato")) return "document_types";
  if (lower.includes("status") || lower.includes("cargados") || lower.includes("tengo doc")) return "document_status";
  if (lower.includes("flow") || lower.includes("analisis") || lower.includes("analizar") || lower.includes("proceso")) return "analysis_flow";
  if (lower.includes("invoice") || lower.includes("pago") || lower.includes("factura") || lower.includes("boleta")) return "invoice_vs_payment";
  return "general";
}

function buildSystemPrompt(knowledgeContent: string): string {
  return `Eres un asistente de gestión documental para microempresas chilenas. Tu rol es guiar y educar. No subes archivos ni haces OCR real.

CONOCIMIENTO CONTEXTUAL:
${knowledgeContent}

REGLAS:
1. No subes archivos ni analizas documentos. Solo orientas.
2. NO hagas OCR real ni pretendas leer contenido de imágenes o PDFs.
3. Si el usuario pregunta por OCR o lectura de fotos, responde honestamente: el análisis en esta fase es simulado.
4. Explica el flujo documental completo: subir -> analizar -> revisar -> confirmar -> Acciones IA -> caja.
5. Diferencia claramente: factura/boleta es documento, caja es movimiento real de dinero.
6. Usa lenguaje claro y simple. Texto plano con saltos de línea. NO uses markdown, negritas ni caracteres especiales.
7. Si tienes acceso a datos reales de documentos, úsalos para responder sobre el estado actual.
8. Para todo lo relacionado con subir archivos, dirige al usuario al módulo Documentos en la barra lateral.

Debes invocar obligatoriamente la herramienta emit_documents_response.`;
}

function formatDocumentSummary(summary: DocumentSummary): string {
  const lines: string[] = [];
  lines.push(`Total de documentos: ${summary.totalDocuments}`);

  if (summary.byFolder.length > 0) {
    lines.push("Por carpeta:");
    for (const f of summary.byFolder) {
      lines.push(`  ${FOLDER_LABELS[f.folder] || f.folder}: ${f.count} documentos`);
    }
  }

  if (summary.byStatus.length > 0) {
    lines.push("Por estado:");
    for (const s of summary.byStatus) {
      lines.push(`  ${STATUS_LABELS[s.status] || s.status}: ${s.count} documentos`);
    }
  }

  if (summary.recentDocuments.length > 0) {
    lines.push("Documentos recientes:");
    for (const d of summary.recentDocuments) {
      const date = d.created_at ? d.created_at.substring(0, 10) : "?";
      lines.push(`  ${date} ${d.name} (${FOLDER_LABELS[d.folder] || d.folder}, ${STATUS_LABELS[d.status] || d.status})`);
    }
  }

  return `Resumen documental:\n${lines.join("\n")}`;
}

function normalizeDocumentsResult(
  raw: Record<string, unknown>,
  summary?: DocumentSummary
): DocumentsAgentResult {
  const message = String(raw.message || "Entiendo tu consulta sobre gestión documental.");
  const topic = sanitizeTopic(String(raw.topic || "general"));
  const acceptedFileTypes = Array.isArray(raw.accepted_file_types)
    ? raw.accepted_file_types as string[]
    : ["PDF", "PNG", "JPG/JPEG"];
  const guidance = Array.isArray(raw.guidance) ? raw.guidance as string[] : [];
  const limitations = Array.isArray(raw.limitations) ? raw.limitations as string[] : [];
  const missingContext = Array.isArray(raw.missing_context) ? raw.missing_context as string[] : [];
  const nextSteps = Array.isArray(raw.next_steps) ? raw.next_steps as string[] : [];
  const confidence = typeof raw.confidence === "number" ? raw.confidence : 0.7;

  const summaryPayload = summary ? {
    total_documents: summary.totalDocuments,
    by_folder: summary.byFolder.map((f) => ({
      folder: FOLDER_LABELS[f.folder] || f.folder,
      count: f.count,
    })),
    by_status: summary.byStatus.map((s) => ({
      status: STATUS_LABELS[s.status] || s.status,
      count: s.count,
    })),
    recent_documents: summary.recentDocuments.map((d) => ({
      id: d.id,
      name: d.name,
      folder: FOLDER_LABELS[d.folder] || d.folder,
      status: STATUS_LABELS[d.status] || d.status,
      file_type: d.file_type,
      created_at: d.created_at,
    })),
  } : undefined;

  return {
    agent: "documents",
    message,
    topic,
    summary: summaryPayload,
    accepted_file_types: acceptedFileTypes,
    guidance,
    limitations,
    missing_context: missingContext,
    next_steps: nextSteps,
    confidence,
    model_used: "claude",
    warnings: [],
  };
}

function detectTopic(inputText: string): DocumentsAgentTopic {
  const lower = inputText.toLowerCase();
  if (lower.includes("ocr") || lower.includes("leer") || lower.includes("foto") || lower.includes("imagen") || lower.includes("vision") || lower.includes("escan")) return "limitations";
  if (lower.includes("puedo subir") || lower.includes("formatos") || lower.includes("tipos aceptados") || lower.includes("acepta")) return "document_types";
  if (lower.includes("subir") || lower.includes("cargar") || lower.includes("subi")) return "upload_guidance";
  if (lower.includes("analizar") || lower.includes("analisis") || lower.includes("analiso") || lower.includes("proceso") || lower.includes("flujo")) return "analysis_flow";
  if (lower.includes("diferencia") || lower.includes("factura") || lower.includes("pago") || lower.includes("boleta")) return "invoice_vs_payment";
  if (lower.includes("tengo") || lower.includes("cargados") || lower.includes("cuantos doc") || lower.includes("documentos")) return "document_status";
  if (lower.includes("tipo") || lower.includes("contrato") || lower.includes("certificado")) return "document_types";
  return "general";
}

function buildFallbackResult(inputText: string, summary?: DocumentSummary): DocumentsAgentResult {
  const topic = detectTopic(inputText);

  const topicMessages: Record<string, string> = {
    upload_guidance: "Para subir un documento, ve al módulo Documentos en la barra lateral. Ahí puedes arrastrar archivos PDF, PNG o JPG de hasta 5 MB. Elige la carpeta correcta (Legal, Tributario, RRHH u Operaciones) antes de subir.",
    document_types: "Puedes subir facturas, boletas, contratos y certificados tributarios. Las carpetas disponibles son: Legal (escrituras, contratos), Tributario (F29, facturas, boletas), RRHH (contratos laborales) y Operaciones (arriendos, proveedores).",
    document_status: "Puedes ver todos tus documentos en el módulo Documentos. Ahí verás cuáles están subidos, analizados, confirmados o si alguno falló.",
    analysis_flow: "El flujo es: subir documento, pulsar Analizar, revisar los datos extraídos, confirmar la extracción, y luego ir a Acciones IA para confirmar el movimiento en caja.",
    invoice_vs_payment: "Una factura o boleta es un documento tributario. El movimiento real de dinero se registra en el libro de caja. Una factura emitida no significa que hayas recibido el pago. Solo después de confirmar en Acciones IA, el movimiento aparece en caja.",
    limitations: "En esta fase, el análisis de documentos es simulado. Los datos extraídos son de prueba. La lectura real del contenido por OCR o visión artificial queda planificada para una fase posterior. Mientras tanto, puedes practicar el flujo completo con datos simulados.",
    general: "Puedo orientarte sobre cómo subir documentos, qué tipos acepta el sistema, cómo funciona el flujo de análisis y la diferencia entre documentos y movimientos de caja. Pregúntame lo que necesites.",
  };

  const message = summary && topic === "document_status"
    ? `${topicMessages.document_status}\n\n${formatDocumentSummary(summary)}`
    : (topicMessages[topic] || topicMessages.general);

  return {
    agent: "documents",
    message,
    topic,
    summary: summary ? {
      total_documents: summary.totalDocuments,
      by_folder: summary.byFolder.map((f) => ({ folder: FOLDER_LABELS[f.folder] || f.folder, count: f.count })),
      by_status: summary.byStatus.map((s) => ({ status: STATUS_LABELS[s.status] || s.status, count: s.count })),
      recent_documents: summary.recentDocuments.map((d) => ({
        id: d.id, name: d.name,
        folder: FOLDER_LABELS[d.folder] || d.folder,
        status: STATUS_LABELS[d.status] || d.status,
        file_type: d.file_type, created_at: d.created_at,
      })),
    } : undefined,
    accepted_file_types: ["PDF", "PNG", "JPG/JPEG"],
    guidance: topic === "upload_guidance"
      ? ["Ve al módulo Documentos en la barra lateral", "Arrastra el archivo o haz clic para seleccionarlo", "Elige la carpeta correcta"]
      : [],
    limitations: topic === "limitations"
      ? ["El análisis en esta fase es simulado", "Los datos extraídos son de prueba", "OCR real queda para fase posterior"]
      : [],
    missing_context: [],
    next_steps: ["Si necesitas subir un archivo, ve al módulo Documentos", "Para ver tus documentos actuales, revisa la sección Documentos"],
    confidence: 0.85,
    model_used: "fallback-deterministic",
    warnings: ["Claude no disponible o salida inválida; se usó fallback determinístico."],
  };
}

export class DocumentsAgent extends BaseAgent<DocumentsAgentResult> {
  protected readonly name = "documents" as const;
  protected readonly domain = "gestion documental";
  protected readonly capabilities = [
    { name: "document_upload_guidance", description: "Guia para subir documentos" },
    { name: "document_status_summary", description: "Resumen de documentos cargados" },
    { name: "document_analysis_explanation", description: "Explica el flujo de analisis" },
    { name: "invoice_vs_payment_explanation", description: "Diferencia factura/pago" },
  ];
  protected readonly knowledgeClient = new McpKnowledgeClient({
    serverUrl: process.env.MCP_DOCUMENTS_URL,
    searchToolName: "search_documents_knowledge",
    sourceName: "MCP Documents",
    fallbackClient: new DocumentsKnowledgeClient(),
  });

  private lastSummary?: DocumentSummary;

  protected buildTool(): ClaudeToolDefinition {
    return DOCUMENTS_TOOL;
  }

  protected buildSystemPrompt(knowledge: { content: string }) {
    return buildSystemPrompt(knowledge.content);
  }

  protected normalizeResult(raw: Record<string, unknown>, _inputText: string): DocumentsAgentResult {
    return normalizeDocumentsResult(raw, this.lastSummary);
  }

  protected getOutputSchema() {
    return documentsAgentResponseSchema;
  }

  protected async persist(): Promise<void> {}

  protected buildFallbackResult(inputText: string): DocumentsAgentResult {
    return buildFallbackResult(inputText, this.lastSummary);
  }

  protected async buildAdditionalContext(context: AgentContext): Promise<string> {
    try {
      this.lastSummary = await getDocumentSummary(context.companyId);
      return formatDocumentSummary(this.lastSummary);
    } catch {
      this.lastSummary = undefined;
      return "No se pudieron cargar los documentos. Responde en modo educativo.";
    }
  }
}
