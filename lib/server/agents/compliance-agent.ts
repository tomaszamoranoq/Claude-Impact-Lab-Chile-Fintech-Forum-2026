import { complianceResponseSchema, ComplianceAgentResult } from "@/lib/schemas";
import type { ComplianceTopic } from "@/lib/schemas";
import { ComplianceKnowledgeClient } from "./knowledge/local/compliance-knowledge-client";
import { McpKnowledgeClient } from "./knowledge/mcp/mcp-knowledge-client";
import { BaseAgent } from "./base-agent";
import { ClaudeToolDefinition } from "./claude-client";

const VALID_TOPICS: ComplianceTopic[] = [
  "f29", "f22", "iva", "municipal_patent", "previred", "tax_start", "general",
];

function sanitizeTopic(raw: string): ComplianceTopic {
  const lower = raw.toLowerCase().trim();
  if (VALID_TOPICS.includes(lower as ComplianceTopic)) return lower as ComplianceTopic;
  if (lower.includes("f29") || lower.includes("iva mensual")) return "f29";
  if (lower.includes("f22") || lower.includes("renta")) return "f22";
  if (lower.includes("patente") || lower.includes("municipal")) return "municipal_patent";
  if (lower.includes("previred") || lower.includes("cotizacion")) return "previred";
  if (lower.includes("inicio") || lower.includes("tax_start")) return "tax_start";
  if (lower.includes("iva")) return "iva";
  return "general";
}

const COMPLIANCE_TOOL: ClaudeToolDefinition = {
  name: "emit_compliance_check",
  description:
    "Emit a structured compliance response for a Chilean microenterprise. Only classify and explain, do not give legal advice or exact dates.",
  input_schema: {
    type: "object" as const,
    properties: {
      message: {
        type: "string",
        description:
          "Respuesta principal en español, clara y simple. Dirigida a un microempresario chileno sin conocimientos tributarios avanzados. Usar frases cortas y separar ideas con saltos de línea simples. No usar markdown, negritas ni caracteres especiales.",
      },
      topic: {
        type: "string",
        description: "Uno de: f29, f22, iva, municipal_patent, previred, tax_start, general",
      },
      explanation: {
        type: "string",
        description: "Explicación educativa del tema, en español simple.",
      },
      obligations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            institution: { type: "string" },
            form_code: { type: "string" },
            frequency: { type: "string" },
            due_hint: { type: "string" },
            applies_if: { type: "string" },
            status_hint: {
              type: "string",
              enum: ["pending", "conditional", "informational"],
            },
          },
          required: ["title", "description", "institution", "status_hint"],
        },
      },
      assumptions: {
        type: "array",
        items: { type: "string" },
      },
      missing_context: {
        type: "array",
        items: { type: "string" },
      },
      next_steps: {
        type: "array",
        items: { type: "string" },
      },
      sources: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          required: ["name"],
        },
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
      },
    },
    required: [
      "message",
      "topic",
      "explanation",
      "obligations",
      "assumptions",
      "missing_context",
      "next_steps",
      "sources",
      "confidence",
    ],
  },
};

function buildSystemPrompt(knowledgeContent: string): string {
  return `Eres un asistente educativo de cumplimiento tributario y legal para microempresas chilenas.

CONOCIMIENTO CONTEXTUAL:
${knowledgeContent}

REGLAS:
1. No das asesoría legal ni tributaria definitiva. Explicas conceptos, no decides por el usuario.
2. NUNCA des fechas exactas de vencimiento. Usa expresiones como "según el calendario mensual del SII", "según calendario anual del SII", "verifica en tu municipalidad".
3. Usa lenguaje claro, simple y directo. Piensa que hablas con un microempresario sin contador.
4. message debe ser texto plano con frases cortas separadas por saltos de línea. NO uses markdown, negritas ni caracteres especiales.
5. Siempre incluye la advertencia de verificar en portales oficiales (SII, Municipalidad, Previred).
6. Si la obligación depende de una condición (ej. tener trabajadores), indícalo con status_hint "conditional" y explica en applies_if.
7. Si el input no es claro, pide más contexto en missing_context.
8. No inventes montos de multas, plazos exactos ni valores de patentes.

Debes invocar obligatoriamente la herramienta emit_compliance_check.`;
}

function normalizeComplianceResult(
  raw: Record<string, unknown>,
  _inputText: string
): ComplianceAgentResult {
  const obligations = Array.isArray(raw.obligations)
    ? (raw.obligations as Array<Record<string, unknown>>).map((o) => ({
        title: String(o.title || ""),
        description: String(o.description || ""),
        institution: String(o.institution || "SII"),
        form_code: o.form_code ? String(o.form_code) : undefined,
        frequency: o.frequency ? String(o.frequency) : undefined,
        due_hint: o.due_hint ? String(o.due_hint) : undefined,
        applies_if: o.applies_if ? String(o.applies_if) : undefined,
        status_hint: (["pending", "conditional", "informational"].includes(String(o.status_hint))
          ? String(o.status_hint)
          : "informational") as "pending" | "conditional" | "informational",
      }))
    : [];

  const assumptions = Array.isArray(raw.assumptions) ? raw.assumptions as string[] : [];
  const missingContext = Array.isArray(raw.missing_context) ? raw.missing_context as string[] : [];
  const nextSteps = Array.isArray(raw.next_steps) ? raw.next_steps as string[] : [];
  const sources = Array.isArray(raw.sources)
    ? (raw.sources as Array<Record<string, unknown>>).map((s) => ({
        name: String(s.name || "SII Chile"),
      }))
    : [];

  const message = String(raw.message || "Aquí tienes información sobre tus obligaciones tributarias.");
  const explanation = String(raw.explanation || message);
  const topic = sanitizeTopic(String(raw.topic || "general"));
  const confidence = typeof raw.confidence === "number" ? raw.confidence : 0.7;

  return {
    agent: "compliance",
    message,
    topic,
    explanation,
    obligations,
    assumptions,
    missing_context: missingContext,
    next_steps: nextSteps,
    sources,
    confidence,
    model_used: "claude",
    warnings: [],
  };
}

function detectTopic(inputText: string): ComplianceTopic {
  const lower = inputText.toLowerCase();
  if (lower.includes("f29") || lower.includes("iva mensual")) return "f29";
  if (lower.includes("f22") || lower.includes("renta anual") || lower.includes("declaración anual")) return "f22";
  if (lower.includes("iva") && !lower.includes("iva mensual")) return "iva";
  if (lower.includes("patente") || lower.includes("municipal")) return "municipal_patent";
  if (lower.includes("previred") || lower.includes("cotización") || lower.includes("contratar") || lower.includes("trabajador")) return "previred";
  if (lower.includes("inicio") || lower.includes("sii") || lower.includes("timbraje") || lower.includes("boleta")) return "tax_start";
  return "general";
}

function buildFallbackResult(inputText: string): ComplianceAgentResult {
  const topic = detectTopic(inputText);

  const topicMessages: Record<string, string> = {
    f29: "El F29 es la declaración mensual de IVA. Se presenta según el calendario mensual del SII. Incluye el IVA de tus ventas (débito fiscal) y el IVA de tus compras del giro (crédito fiscal). Debes presentarlo aunque no tengas movimiento en el mes. Se hace en línea en SII.cl con tu clave tributaria.",
    f22: "El F22 es la declaración anual de renta. Se presenta según el calendario anual del SII. Para el régimen PROPYME General, la base imponible se calcula sobre los ingresos y egresos del año comercial. Debes mantener al día tu libro de caja para facilitar este trámite.",
    iva: "El IVA (Impuesto al Valor Agregado) funciona con una tasa general que debes verificar en SII.cl. Esta guía explica el mecanismo: como empresa, cobras IVA en tus boletas y facturas (débito fiscal) y pagas IVA en tus compras del giro (crédito fiscal). La diferencia se declara mensualmente en el F29. Solo puedes usar como crédito el IVA de compras relacionadas con tu actividad.",
    municipal_patent: "La patente municipal es obligatoria si operas con local comercial. Se solicita en la municipalidad de tu domicilio comercial. El valor depende del capital propio y del rubro. Se renueva anualmente. Requiere inicio de actividades en SII y contrato de arriendo o título de dominio. Verifica requisitos exactos en tu municipalidad.",
    previred: "Previred es el sistema de declaración y pago de cotizaciones previsionales. Aplica SOLO si tienes trabajadores dependientes contratados. Incluye AFP, salud y seguro de cesantía. Se declara mensualmente según el calendario de Previred. Si no tienes trabajadores, no necesitas usar Previred por ahora.",
    tax_start: "El inicio de actividades es el trámite que formaliza tu empresa ante el SII. Define tu giro tributario y el régimen en que tributarás. Se hace una sola vez mediante el Formulario 4415 en SII.cl. Después, debes solicitar timbraje de boletas y facturas electrónicas para poder operar legalmente.",
    general: "Como microempresa chilena, tus principales obligaciones son: inicio de actividades en SII, F29 mensual de IVA, F22 anual de renta, patente municipal (si tienes local), y Previred (solo si tienes trabajadores). Verifica siempre las fechas y requisitos exactos en los portales oficiales.",
  };

  const topicExplanations: Record<string, string> = {
    f29: "Explicación del F29 y la declaración mensual de IVA para microempresas chilenas.",
    f22: "Explicación del F22 y la declaración anual de renta.",
    iva: "Explicación del IVA: débito fiscal, crédito fiscal y su funcionamiento.",
    municipal_patent: "Explicación de la patente municipal y su renovación.",
    previred: "Explicación de Previred y las cotizaciones previsionales.",
    tax_start: "Explicación del inicio de actividades en el SII.",
    general: "Resumen de obligaciones tributarias principales para microempresas chilenas.",
  };

  const topicObligations: Record<string, Array<Record<string, unknown>>> = {
    f29: [
      { title: "F29 - Declaración mensual de IVA", description: "Declaración mensual de IVA (débito y crédito fiscal).", institution: "SII", form_code: "F29", frequency: "mensual", due_hint: "Según calendario mensual del SII", status_hint: "pending" },
    ],
    f22: [
      { title: "F22 - Declaración anual de renta", description: "Declaración anual de impuesto a la renta.", institution: "SII", form_code: "F22", frequency: "anual", due_hint: "Según calendario anual del SII", status_hint: "pending" },
    ],
    iva: [
      { title: "IVA - Impuesto al Valor Agregado", description: "Impuesto sobre ventas y servicios. Débito y crédito fiscal.", institution: "SII", form_code: "F29", frequency: "mensual", status_hint: "informational" },
    ],
    municipal_patent: [
      { title: "Patente Municipal", description: "Permiso municipal para operar con local comercial. Se renueva anualmente.", institution: "Municipalidad correspondiente", frequency: "anual", due_hint: "Verifica en tu municipalidad", status_hint: "pending" },
    ],
    previred: [
      { title: "Previred - Cotizaciones previsionales", description: "Declaración y pago mensual de AFP, salud y seguro de cesantía.", institution: "Previred", frequency: "mensual", applies_if: "Si tienes trabajadores dependientes contratados", status_hint: "conditional" },
    ],
    tax_start: [
      { title: "Inicio de Actividades en SII", description: "Trámite único de formalización tributaria. Define giro y régimen.", institution: "SII", form_code: "4415", frequency: "única vez", status_hint: "informational" },
    ],
    general: [
      { title: "Inicio de Actividades", description: "Formalización tributaria ante el SII.", institution: "SII", frequency: "única vez", status_hint: "informational" },
      { title: "F29 - IVA Mensual", description: "Declaración mensual de IVA.", institution: "SII", form_code: "F29", frequency: "mensual", due_hint: "Según calendario SII", status_hint: "pending" },
      { title: "F22 - Renta Anual", description: "Declaración anual de renta.", institution: "SII", form_code: "F22", frequency: "anual", due_hint: "Según calendario anual del SII", status_hint: "pending" },
      { title: "Patente Municipal", description: "Permiso municipal anual.", institution: "Municipalidad correspondiente", frequency: "anual", status_hint: "pending" },
      { title: "Previred", description: "Cotizaciones previsionales mensuales.", institution: "Previred", frequency: "mensual", applies_if: "Si tienes trabajadores", status_hint: "conditional" },
    ],
  };

  const message = topicMessages[topic] || topicMessages.general;
  const explanation = topicExplanations[topic] || topicExplanations.general;

  return {
    agent: "compliance",
    message,
    topic,
    explanation,
    obligations: (topicObligations[topic] || topicObligations.general) as ComplianceAgentResult["obligations"],
    assumptions: ["El usuario es una microempresa chilena bajo régimen PROPYME General con Contabilidad Simplificada."],
    missing_context: topic === "previred" ? ["¿Ya tienes trabajadores contratados?", "¿Cuántos?"] : [],
    next_steps: ["Verifica fechas exactas en SII.cl", "Consulta requisitos en tu municipalidad si aplica", "Si tienes dudas específicas, consulta con un contador"],
    sources: [{ name: "SII Chile" }, { name: "Previred" }, { name: "Municipalidad correspondiente" }, { name: "Copiloto Pyme" }],
    confidence: 0.85,
    model_used: "fallback-deterministic",
    warnings: ["Claude no disponible o salida inválida; se usó fallback determinístico."],
  };
}

export class ComplianceAgent extends BaseAgent<ComplianceAgentResult> {
  protected readonly name = "compliance" as const;
  protected readonly domain = "cumplimiento tributario y legal";
  protected readonly capabilities = [
    { name: "tax_calendar", description: "Explica obligaciones tributarias recurrentes" },
    { name: "municipal_requirements", description: "Explica patente y permisos municipales" },
    { name: "labor_compliance", description: "Explica obligaciones previsionales (Previred)" },
  ];
  protected readonly knowledgeClient = new McpKnowledgeClient({
    serverUrl: process.env.MCP_COMPLIANCE_URL,
    searchToolName: "search_compliance_knowledge",
    sourceName: "MCP Compliance",
    fallbackClient: new ComplianceKnowledgeClient(),
  });

  protected buildTool(): ClaudeToolDefinition {
    return COMPLIANCE_TOOL;
  }

  protected buildSystemPrompt(knowledge: { content: string }) {
    return buildSystemPrompt(knowledge.content);
  }

  protected normalizeResult(raw: Record<string, unknown>, inputText: string): ComplianceAgentResult {
    return normalizeComplianceResult(raw, inputText);
  }

  protected getOutputSchema() {
    return complianceResponseSchema;
  }

  protected async persist(): Promise<void> {}

  protected buildFallbackResult(inputText: string): ComplianceAgentResult {
    return buildFallbackResult(inputText);
  }
}
