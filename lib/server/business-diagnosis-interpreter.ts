import { anthropicClient, anthropicModel } from "./anthropic";
import {
  AIBusinessDiagnosisClassifier,
  AIBusinessDiagnosisEmitter,
  aiBusinessDiagnosisClassifierSchema,
  aiBusinessDiagnosisEmitterSchema,
  CreateBusinessDiagnosisInput,
} from "@/lib/schemas";

export interface BusinessDiagnosisResult {
  isBusinessDiagnosis: boolean;
  message: string;
  diagnosis?: Omit<CreateBusinessDiagnosisInput, "model_used">;
  model_used: string;
  interpreter: "claude" | "fallback";
}

const triStateInputSchema = {
  anyOf: [{ type: "boolean" }, { type: "string", enum: ["unknown"] }],
};

const CLASSIFIER_TOOL = {
  name: "classify_business_diagnosis",
  description:
    "Determine whether the user input describes an initial business idea/context or an operational action",
  input_schema: {
    type: "object" as const,
    properties: {
      is_business_diagnosis: { type: "boolean" },
      message: { type: "string" },
    },
    required: ["is_business_diagnosis", "message"],
  },
};

const EMITTER_TOOL = {
  name: "emit_business_diagnosis",
  description:
    "Emit a structured business diagnosis for a Chilean microenterprise. Only call this when the input is clearly a business idea/context.",
  input_schema: {
    type: "object" as const,
    properties: {
      message: { type: "string" },
      business_profile: {
        type: "object",
        properties: {
          business_activity_category: {
            type: "string",
            enum: [
              "food",
              "retail",
              "services",
              "professional_services",
              "manufacturing",
              "digital_business",
              "transport",
              "construction",
              "health_beauty",
              "education",
              "other",
              "unknown",
            ],
          },
          business_description: { type: "string" },
          municipality: { type: "string" },
          has_partners: triStateInputSchema,
          partners_count: { type: "integer", minimum: 0 },
          plans_to_hire: triStateInputSchema,
          operates_from_home: triStateInputSchema,
          expected_revenue_range: { type: "string" },
          notes: { type: "string" },
        },
        required: [
          "business_activity_category",
          "business_description",
          "has_partners",
          "plans_to_hire",
          "operates_from_home",
        ],
      },
      recommended_legal_type: {
        type: "string",
        enum: [
          "Empresario Individual",
          "EIRL",
          "SpA",
          "unknown",
        ],
      },
      lifecycle_stage: {
        type: "string",
        enum: [
          "exploration",
          "constitution",
          "tax_start",
          "operation",
          "hiring",
          "regularization",
          "closing",
        ],
      },
      assumptions: {
        type: "array",
        items: { type: "string" },
      },
      unknowns: {
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
        description: "Number from 0 to 1. If uncertain, use 0.7.",
      },
    },
    required: [
      "message",
      "business_profile",
      "recommended_legal_type",
      "lifecycle_stage",
      "assumptions",
      "unknowns",
      "next_steps",
      "confidence",
    ],
  },
};

function buildClassifierPrompt(): string {
  return `Eres un clasificador binario. Tu única tarea es determinar si el mensaje del usuario describe una idea o contexto inicial de negocio.

REGLAS:
- Si el input es una acción operativa ("pagué arriendo", "vendí café", "quiero constituir una SpA"), responde is_business_diagnosis: false.
- Si el input describe una idea de negocio, rubro, comuna, socios, planes, responde is_business_diagnosis: true.
- Sé conservador: si dudas, responde false.

Debes invocar obligatoriamente la herramienta classify_business_diagnosis.`;
}

function buildEmitterPrompt(): string {
  return `Eres un asistente de diagnóstico inicial para microempresas chilenas.

El usuario ha sido clasificado como describiendo una idea/contexto de negocio.
Tu tarea es extraer y estructurar la información disponible.

REGLAS:
1. No inventes datos. Si falta información, usa "unknown" o omite campos opcionales.
2. No das asesoría legal definitiva. Propones, no decides.
3. Conserva la riqueza del caso en business_description, notes, assumptions, unknowns.
4. partners_count significa número total de personas dueñas/socias, incluyendo al usuario.
5. Si el usuario dice "con mi hermano", "con mi socio", "con mi pareja" u otra persona, has_partners debe ser true.
6. Si hay exactamente una persona adicional al usuario, partners_count debe ser 2.
7. Si has_partners es true, recommended_legal_type debe ser "SpA" o "unknown", nunca "EIRL" ni "Empresario Individual".
8. next_steps debe incluir 3 a 5 pasos concretos y breves.

Debes invocar obligatoriamente la herramienta emit_business_diagnosis.`;
}

function normalizeDiagnosis(
  inputText: string,
  emitted: AIBusinessDiagnosisEmitter
): AIBusinessDiagnosisEmitter {
  const normalized = { ...emitted };
  const assumptions = [...emitted.assumptions];
  let nextSteps = [...emitted.next_steps];

  // Regla: socios + figura legal inconsistente
  if (
    normalized.business_profile.has_partners === true &&
    (normalized.recommended_legal_type === "EIRL" ||
      normalized.recommended_legal_type === "Empresario Individual")
  ) {
    normalized.recommended_legal_type = "SpA";
    assumptions.push(
      "Al existir socios, se ajusta la recomendación a SpA porque EIRL y Empresario Individual son figuras de un solo titular."
    );
  }

  // Regla: partners_count faltante o menor que 2
  const partnerKeywords = /hermano|socio|pareja|amigo|con mi/i;
  if (
    normalized.business_profile.has_partners === true &&
    (typeof normalized.business_profile.partners_count !== "number" ||
      normalized.business_profile.partners_count < 2)
  ) {
    if (partnerKeywords.test(inputText)) {
      normalized.business_profile = {
        ...normalized.business_profile,
        partners_count: 2,
      };
      assumptions.push(
        "Se interpreta la mención de otra persona como dos socios totales incluyendo al usuario."
      );
    }
  }

  // Regla: next_steps vacío
  if (nextSteps.length === 0) {
    nextSteps = [
      "Confirmar socios, aportes y roles.",
      "Elegir figura legal preliminar.",
      "Preparar constitución en Empresa en un Día.",
      "Revisar permisos municipales y sanitarios aplicables.",
      "Planificar inicio de actividades ante SII.",
    ];
  }

  return {
    ...normalized,
    assumptions,
    next_steps: nextSteps,
  };
}

async function callClassifier(
  inputText: string
): Promise<AIBusinessDiagnosisClassifier> {
  if (!anthropicClient) {
    throw new Error("Anthropic client not configured");
  }

  const response = await anthropicClient.messages.create({
    model: anthropicModel,
    max_tokens: 128,
    temperature: 0,
    system: buildClassifierPrompt(),
    messages: [{ role: "user", content: inputText }],
    tools: [CLASSIFIER_TOOL],
    tool_choice: { type: "tool", name: "classify_business_diagnosis" },
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude classifier did not use the expected tool");
  }

  return aiBusinessDiagnosisClassifierSchema.parse(toolUse.input);
}

async function callDiagnosisEmitter(
  inputText: string
): Promise<AIBusinessDiagnosisEmitter> {
  if (!anthropicClient) {
    throw new Error("Anthropic client not configured");
  }

  const response = await anthropicClient.messages.create({
    model: anthropicModel,
    max_tokens: 512,
    temperature: 0,
    system: buildEmitterPrompt(),
    messages: [{ role: "user", content: inputText }],
    tools: [EMITTER_TOOL],
    tool_choice: { type: "tool", name: "emit_business_diagnosis" },
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude emitter did not use the expected tool");
  }

  return aiBusinessDiagnosisEmitterSchema.parse(toolUse.input);
}

export async function interpretBusinessDiagnosis(
  inputText: string
): Promise<BusinessDiagnosisResult> {
  if (!anthropicClient) {
    return {
      isBusinessDiagnosis: false,
      message:
        "Para obtener un diagnóstico inicial, configura ANTHROPIC_API_KEY. Por ahora, cuéntame más sobre tu negocio.",
      model_used: "none",
      interpreter: "fallback",
    };
  }

  try {
    // Paso 1: clasificar
    const classification = await callClassifier(inputText);

    if (!classification.is_business_diagnosis) {
      return {
        isBusinessDiagnosis: false,
        message: classification.message,
        model_used: anthropicModel,
        interpreter: "claude",
      };
    }

    // Paso 2: emitir diagnóstico estructurado
    const emitted = await callDiagnosisEmitter(inputText);
    const normalized = normalizeDiagnosis(inputText, emitted);

    return {
      isBusinessDiagnosis: true,
      message: normalized.message,
      diagnosis: {
        input_text: inputText,
        business_profile: normalized.business_profile,
        recommended_legal_type: normalized.recommended_legal_type,
        lifecycle_stage: normalized.lifecycle_stage,
        assumptions: normalized.assumptions,
        unknowns: normalized.unknowns,
        next_steps: normalized.next_steps,
        confidence: normalized.confidence,
      },
      model_used: anthropicModel,
      interpreter: "claude",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn("Claude business diagnosis interpretation failed:", message);

    return {
      isBusinessDiagnosis: false,
      message:
        "No pude procesar tu mensaje como diagnóstico. ¿Puedes contarme más sobre tu negocio?",
      model_used: "mock-regex",
      interpreter: "fallback",
    };
  }
}
