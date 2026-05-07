import { resolutionAgentResponseSchema, ResolutionAgentResult } from "@/lib/schemas";
import type { ResolutionTopic } from "@/lib/schemas";
import { ResolutionKnowledgeClient } from "./knowledge/local/resolution-knowledge-client";
import { BaseAgent } from "./base-agent";
import { AgentContext, KnowledgeQuery, KnowledgeQueryContext } from "./types";
import { ClaudeToolDefinition } from "./claude-client";

const RESOLUTION_TOOL: ClaudeToolDefinition = {
  name: "emit_resolution_guidance",
  description:
    "Emit a structured resolution guidance response for a Chilean microenterprise facing closure, debts, tax termination or legal risks. Never give legal advice or promise results.",
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
        description: "Uno de: business_closure, tax_termination, debts, inactive_business, tax_debt_regularization, legal_risk, general",
      },
      checklist: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            institution: { type: "string" },
            risk_level: { type: "string", enum: ["low", "medium", "high"] },
            status_hint: { type: "string", enum: ["pending", "conditional", "informational"] },
          },
          required: ["title", "description", "risk_level", "status_hint"],
        },
        description: "Pasos para completar el cierre o regularizacion",
      },
      risks: {
        type: "array",
        items: { type: "string" },
        description: "Riesgos detectados que el usuario debe conocer",
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
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
      },
    },
    required: ["message", "topic", "confidence"],
  },
};

const VALID_TOPICS: ResolutionTopic[] = [
  "business_closure", "tax_termination", "debts",
  "inactive_business", "tax_debt_regularization", "legal_risk", "general",
];

function sanitizeTopic(raw: string): ResolutionTopic {
  const lower = raw.toLowerCase().trim();
  if (VALID_TOPICS.includes(lower as ResolutionTopic)) return lower as ResolutionTopic;
  if (lower.includes("tax_termination") || lower.includes("termino de giro") || lower.includes("término de giro")) return "tax_termination";
  if (lower.includes("tax_debt") || lower.includes("tribut") && lower.includes("regulariz")) return "tax_debt_regularization";
  if (lower.includes("debt") || lower.includes("deuda") || lower.includes("no puedo pagar")) return "debts";
  if (lower.includes("legal") || lower.includes("riesgo") || lower.includes("demanda") || lower.includes("embargo") || lower.includes("quiebra") || lower.includes("insolvencia")) return "legal_risk";
  if (lower.includes("inactive") || lower.includes("inactiva") || lower.includes("abandonar") || lower.includes("dejar la empresa")) return "inactive_business";
  if (lower.includes("cerrar") || lower.includes("cierre") || lower.includes("disolver")) return "business_closure";
  return "general";
}

function sanitizeRiskLevel(raw: string): "low" | "medium" | "high" {
  const lower = raw.toLowerCase().trim();
  if (["low", "medium", "high"].includes(lower)) return lower as "low" | "medium" | "high";
  if (lower.includes("alta") || lower.includes("alto") || lower.includes("high")) return "high";
  if (lower.includes("media") || lower.includes("medio") || lower.includes("medium")) return "medium";
  return "low";
}

function buildSystemPrompt(knowledgeContent: string): string {
  return `Eres un asistente de orientacion para cierre, termino de giro y resolucion de problemas criticos de microempresas chilenas. Tu rol es educativo y preventivo. No ejecutas tramites.

CONOCIMIENTO CONTEXTUAL:
${knowledgeContent}

REGLAS:
1. No das asesoria legal definitiva. Explicas conceptos y rutas posibles.
2. NUNCA digas que cerrar la empresa elimina las deudas. Las deudas persisten.
3. NUNCA prometas resultados ni des fechas exactas de plazos legales.
4. Si el usuario menciona trabajadores, deudas previsionales o cotizaciones impagas, eleva el riesgo e indica que son prioritarias.
5. Si detectas senales de demanda, embargo, quiebra o insolvencia, recomienda abogado especializado.
6. Usa lenguaje claro y simple. Texto plano con saltos de linea. NO uses markdown, negritas ni caracteres especiales.
7. Siempre devuelve un checklist de pasos, riesgos detectados, datos faltantes y proximos pasos.
8. Recomienda verificar con SII, Tesoreria, municipalidad, Direccion del Trabajo, Previred y contador/abogado segun el caso.

Debes invocar obligatoriamente la herramienta emit_resolution_guidance.`;
}

function normalizeResolutionResult(
  raw: Record<string, unknown>
): ResolutionAgentResult {
  const message = String(raw.message || "Entiendo tu consulta sobre cierre o regularizacion. Te oriento con los pasos principales.");
  const topic = sanitizeTopic(String(raw.topic || "general"));
  const confidence = typeof raw.confidence === "number" ? raw.confidence : 0.7;

  const checklist = Array.isArray(raw.checklist)
    ? (raw.checklist as Array<Record<string, unknown>>).map((c) => ({
        title: String(c.title || ""),
        description: String(c.description || ""),
        institution: c.institution ? String(c.institution) : undefined,
        risk_level: sanitizeRiskLevel(String(c.risk_level || "low")),
        status_hint: (
          ["pending", "conditional", "informational"].includes(String(c.status_hint))
            ? String(c.status_hint)
            : "pending"
        ) as "pending" | "conditional" | "informational",
      }))
    : [];

  const risks = Array.isArray(raw.risks) ? (raw.risks as unknown[]).filter((r): r is string => typeof r === "string") : [];
  const assumptions = Array.isArray(raw.assumptions) ? (raw.assumptions as unknown[]).filter((a): a is string => typeof a === "string") : [];
  const missingContext = Array.isArray(raw.missing_context) ? (raw.missing_context as unknown[]).filter((m): m is string => typeof m === "string") : [];
  const nextSteps = Array.isArray(raw.next_steps) ? (raw.next_steps as unknown[]).filter((n): n is string => typeof n === "string") : [];

  return {
    agent: "resolution",
    message,
    topic,
    checklist,
    risks,
    assumptions,
    missing_context: missingContext,
    next_steps: nextSteps,
    sources: [
      { name: "SII Chile" },
      { name: "Tesoreria General de la Republica" },
      { name: "Direccion del Trabajo" },
      { name: "Copiloto Pyme" },
    ],
    confidence,
    model_used: "claude",
    warnings: [],
  };
}

function detectTopic(inputText: string): ResolutionTopic {
  const lower = inputText.toLowerCase();
  if (lower.includes("demanda") || lower.includes("embargo") || lower.includes("quiebra") || lower.includes("insolvencia")) return "legal_risk";
  if (lower.includes("riesgo legal")) return "legal_risk";
  if (lower.includes("termino de giro") || lower.includes("término de giro") || lower.includes("tributario") && (lower.includes("cerrar") || lower.includes("terminar"))) return "tax_termination";
  if (lower.includes("impuesto") || lower.includes("tributaria") && (lower.includes("deuda") || lower.includes("regularizar") || lower.includes("atraso"))) return "tax_debt_regularization";
  if (lower.includes("regularizar") || lower.includes("atraso") || lower.includes("moroso") || lower.includes("no puedo pagar")) return "tax_debt_regularization";
  if (lower.includes("deuda") || lower.includes("debo") || lower.includes("no pago")) return "debts";
  if (lower.includes("inactiva") || lower.includes("inactivo") || lower.includes("abandonar") || lower.includes("dejar la empresa")) return "inactive_business";
  if (lower.includes("cerrar") || lower.includes("cierre") || lower.includes("disolver") || lower.includes("liquidar empresa")) return "business_closure";
  return "general";
}

function buildFallbackResult(inputText: string): ResolutionAgentResult {
  const topic = detectTopic(inputText);

  const topicMessages: Record<string, string> = {
    business_closure: "Para cerrar tu empresa de forma ordenada, considera estos pasos:\n\n1. Revisa deudas tributarias pendientes en SII.\n2. Revisa deudas previsionales y laborales si tuviste trabajadores.\n3. Revisa deudas comerciales (proveedores, bancos, arriendos).\n4. Realiza el termino de giro ante el SII.\n5. Cierra cuentas bancarias comerciales.\n6. Informa a la municipalidad.\n\nImportante: cerrar la empresa NO elimina las deudas. Las deudas deben pagarse o negociarse.",
    tax_termination: "El termino de giro es el tramite ante el SII para finalizar la actividad tributaria de tu empresa. Debes tener al dia tus declaraciones de impuestos. Se realiza mediante el Formulario 2121 en SII.cl.\n\nRequisitos: clave tributaria del representante legal, revision de deudas tributarias pendientes.\n\nEl termino de giro no elimina deudas anteriores. Verifica plazos y requisitos exactos en SII.cl.",
    debts: "Para enfrentar deudas empresariales, identifica primero de que tipo son:\n\n- Tributarias (SII, Tesoreria)\n- Previsionales (AFP, salud, cesantia)\n- Laborales (sueldos, finiquitos)\n- Comerciales (proveedores, bancos)\n- Municipales (patentes)\n\nPrioriza las laborales y previsionales. Evalua convenios con Tesoreria para deudas tributarias. Las deudas no desaparecen al cerrar la empresa.",
    inactive_business: "Dejar tu empresa sin movimiento no la hace desaparecer. Aunque no operes, pueden seguir generandose obligaciones como declaraciones de IVA en cero o cobro de patente municipal.\n\nAntes de abandonarla, verifica que no tengas declaraciones pendientes en el SII e informate en tu municipalidad. Evalua si te conviene hacer termino de giro o mantener una pausa controlada con apoyo de un contador.",
    tax_debt_regularization: "Si tienes impuestos atrasados, puedes regularizar tu situacion ante el SII y Tesoreria. Las opciones incluyen pago total o convenio de pago en cuotas. Los intereses y multas se acumulan si no regularizas.\n\nPara iniciar un convenio necesitas tu clave tributaria. Te recomiendo revisar tu situacion en SII.cl y consultar con un contador para evaluar montos y opciones.",
    legal_risk: "Si enfrentas demandas, embargos, juicios laborales o senales de insolvencia, te recomiendo buscar asesoria profesional especializada. Un abogado puede orientarte sobre tus opciones legales.\n\nNo tomes decisiones sin asesoria. Las deudas laborales y previsionales tienen prioridad legal. Si no pagas cotizaciones, puedes enfrentar consecuencias graves.",
    general: "Puedo orientarte sobre como cerrar tu empresa, hacer termino de giro, manejar deudas, mantener la empresa inactiva de forma controlada o regularizar atrasos. Cuentame mas sobre tu situacion para ayudarte mejor.",
  };

  const topicChecklist: Record<string, Array<{ title: string; description: string; institution?: string; risk_level: string; status_hint: string }>> = {
    business_closure: [
      { title: "Revisar deudas tributarias", description: "Verificar F29, F22 y otros impuestos pendientes", institution: "SII", risk_level: "high", status_hint: "pending" },
      { title: "Revisar deudas previsionales", description: "Cotizaciones impagas de trabajadores si los hubo", institution: "Previred", risk_level: "high", status_hint: "conditional" },
      { title: "Revisar deudas comerciales", description: "Proveedores, bancos, arriendos pendientes", risk_level: "medium", status_hint: "pending" },
      { title: "Termino de giro SII", description: "Formulario 2121 en SII.cl con clave tributaria", institution: "SII", risk_level: "high", status_hint: "pending" },
      { title: "Cerrar cuentas bancarias", description: "Cuentas comerciales asociadas a la empresa", risk_level: "medium", status_hint: "pending" },
      { title: "Informar a la municipalidad", description: "Dar aviso de cese de actividades", institution: "Municipalidad", risk_level: "medium", status_hint: "pending" },
    ],
    tax_termination: [
      { title: "Declaraciones al dia", description: "F29, F22 y otras declaraciones pendientes", institution: "SII", risk_level: "high", status_hint: "pending" },
      { title: "Solicitar termino de giro", description: "Formulario 2121 en SII.cl", institution: "SII", risk_level: "high", status_hint: "pending" },
      { title: "Revisar deudas tributarias", description: "Impuestos, multas e intereses pendientes", institution: "SII", risk_level: "high", status_hint: "pending" },
    ],
    debts: [
      { title: "Identificar deudas laborales", description: "Sueldos, finiquitos, cotizaciones", institution: "DT, Previred", risk_level: "high", status_hint: "conditional" },
      { title: "Identificar deudas tributarias", description: "Impuestos y multas pendientes", institution: "SII, Tesoreria", risk_level: "high", status_hint: "pending" },
      { title: "Identificar deudas comerciales", description: "Proveedores, bancos, arriendos", risk_level: "medium", status_hint: "pending" },
    ],
    inactive_business: [
      { title: "Verificar declaraciones pendientes", description: "Revisar si hay F29 u otras obligaciones", institution: "SII", risk_level: "medium", status_hint: "pending" },
      { title: "Revisar patente municipal", description: "Verificar estado de cobro de patente", institution: "Municipalidad", risk_level: "medium", status_hint: "conditional" },
      { title: "Evaluar termino de giro", description: "Decidir si conviene cerrar formalmente", institution: "SII", risk_level: "medium", status_hint: "informational" },
    ],
    tax_debt_regularization: [
      { title: "Revisar deuda en SII.cl", description: "Consultar estado de impuestos pendientes", institution: "SII", risk_level: "high", status_hint: "pending" },
      { title: "Evaluar convenio de pago", description: "Solicitar convenio en Tesoreria si no puedes pagar todo", institution: "Tesoreria", risk_level: "high", status_hint: "pending" },
      { title: "Consultar con contador", description: "Revisar montos exactos y opciones de regularizacion", risk_level: "medium", status_hint: "pending" },
    ],
    legal_risk: [
      { title: "Consultar abogado especializado", description: "Para evaluar opciones legales ante demanda o embargo", risk_level: "high", status_hint: "pending" },
      { title: "Revisar deudas laborales", description: "Sueldos, finiquitos y cotizaciones son prioritarios legalmente", institution: "DT, Previred", risk_level: "high", status_hint: "conditional" },
      { title: "No tomar decisiones sin asesoria", description: "Esperar orientacion profesional antes de actuar", risk_level: "high", status_hint: "pending" },
    ],
  };

  const topicRisks: Record<string, string[]> = {
    business_closure: ["Cerrar no elimina deudas", "Deudas tributarias pueden generar multas e intereses", "Deudas laborales tienen prioridad legal"],
    tax_termination: ["El termino de giro no elimina deudas anteriores", "Debes tener declaraciones al dia antes de solicitarlo"],
    debts: ["Deudas impagas generan intereses y posibles cobros legales", "Deudas laborales y previsionales son las mas urgentes"],
    inactive_business: ["Dejar la empresa inactiva no elimina obligaciones", "Pueden seguir generandose declaraciones y cobros"],
    tax_debt_regularization: ["Los intereses y multas se acumulan mientras no regularices", "Tesoreria puede iniciar cobranza si no actuas"],
    legal_risk: ["Las demandas y embargos requieren asesoria profesional urgente", "Las deudas laborales tienen prioridad legal sobre otras"],
  };

  const checklist = topicChecklist[topic] || [];
  const risks = topicRisks[topic] || [];

  return {
    agent: "resolution",
    message: topicMessages[topic] || topicMessages.general,
    topic,
    checklist: checklist as ResolutionAgentResult["checklist"],
    risks,
    assumptions: ["El usuario es una microempresa chilena que consulta sobre cierre, deudas o regularizacion."],
    missing_context: ["Tiene trabajadores contratados?", "Tiene deudas tributarias pendientes?", "Tiene deudas comerciales o bancarias?"],
    next_steps: [
      "Verifica tu situacion tributaria en SII.cl",
      "Si tienes trabajadores, revisa cotizaciones en Previred",
      "Consulta con un contador o abogado segun tu caso",
    ],
    sources: [
      { name: "SII Chile" },
      { name: "Tesoreria General de la Republica" },
      { name: "Direccion del Trabajo" },
      { name: "Copiloto Pyme" },
    ],
    confidence: 0.85,
    model_used: "fallback-deterministic",
    warnings: ["Claude no disponible o salida invalida; se uso fallback deterministico."],
  };
}

export class ResolutionAgent extends BaseAgent<ResolutionAgentResult> {
  protected readonly name = "resolution" as const;
  protected readonly domain = "cierre, regularizacion y resolucion de problemas empresariales";
  protected readonly capabilities = [
    { name: "business_closure_guidance", description: "Guia para cerrar una empresa ordenadamente" },
    { name: "tax_termination_guidance", description: "Explica termino de giro ante el SII" },
    { name: "debt_regularization", description: "Orienta sobre deudas y regularizacion" },
    { name: "inactive_business_guidance", description: "Explica riesgos de empresa inactiva" },
    { name: "legal_risk_triage", description: "Triaje de riesgos legales y recomendaciones" },
  ];
  protected readonly knowledgeClient = new ResolutionKnowledgeClient();

  protected buildTool(): ClaudeToolDefinition {
    return RESOLUTION_TOOL;
  }

  protected buildSystemPrompt(knowledge: { content: string }) {
    return buildSystemPrompt(knowledge.content);
  }

  protected buildKnowledgeQuery(
    company: Record<string, unknown> | null,
    context: AgentContext
  ): KnowledgeQuery {
    const topic = detectTopic(context.inputText);
    return {
      topic,
      context: {
        hasPartners: company?.has_partners as boolean | undefined,
        stage: company?.lifecycle_stage as string | undefined,
        industry: company?.industry as string | undefined,
        municipality: company?.municipality as string | undefined,
        plansToHire: company?.plans_to_hire as boolean | "unknown" | undefined,
      } as KnowledgeQueryContext,
    };
  }

  protected normalizeResult(raw: Record<string, unknown>, _inputText: string): ResolutionAgentResult {
    return normalizeResolutionResult(raw);
  }

  protected getOutputSchema() {
    return resolutionAgentResponseSchema;
  }

  protected async persist(): Promise<void> {}

  protected buildFallbackResult(inputText: string): ResolutionAgentResult {
    return buildFallbackResult(inputText);
  }
}
