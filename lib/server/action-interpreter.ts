import { anthropicClient, anthropicModel } from "./anthropic";
import {
  AIInterpretation,
  aiInterpretationSchema,
  isAIFinancialPayload,
} from "@/lib/schemas";
import {
  ChatResponse,
  detectAction,
  getActionResponse,
  getMockResponse,
  ProposedAction,
} from "@/lib/mock-data";
import { extractJsonObject } from "./extract-json";

export interface InterpretResult {
  response: ChatResponse;
  model_used: string;
  interpreter: "claude" | "fallback";
}

function buildSystemPrompt(today: string): string {
  return `Eres un clasificador estricto de instrucciones operativas para microempresas chilenas.

DOMINIO PERMITIDO:
- Registrar ingresos de caja (ventas, cobros)
- Registrar egresos de caja (compras, arriendo, servicios, materias primas)
- Constituir empresa (SpA, EIRL, Empresario Individual)
- Ninguna de las anteriores

REGLAS:
1. Solo clasificas. No das asesoría legal, tributaria ni laboral extensa.
2. No inventes datos. Si falta un monto o fecha, usa missing_fields.
3. Fechas relativas deben resolverse usando la fecha actual: ${today}.
4. Si el input no es una instrucción operativa clara dentro del dominio, devuelve intent "none".
5. Responde SOLO con un objeto JSON válido. Sin markdown, sin explicaciones extra.

FORMATO DE RESPUESTA JSON:
{
  "intent": "create_cash_income" | "create_cash_expense" | "create_company_constitution" | "none",
  "payload": { ... }, // obligatorio si intent != "none"
  "confidence": 0.0 - 1.0,
  "missing_fields": ["campo1", "campo2"],
  "reason": "breve explicación de la clasificación",
  "message": "mensaje conversacional breve si intent es 'none'"
}

PAYLOAD para financieras:
{
  "type": "income" | "expense",
  "amount": number,
  "category": "Ventas" | "Arriendo" | "Servicios" | "Materias primas" | "Equipamiento" | "Otro",
  "description": "string",
  "date": "YYYY-MM-DD"
}

PAYLOAD para constitución:
{
  "legal_type": "SpA" | "EIRL" | "Empresario Individual",
  "description": "string",
  "date": "YYYY-MM-DD"
}`;
}

async function callClaude(inputText: string): Promise<AIInterpretation> {
  if (!anthropicClient) {
    throw new Error("Anthropic client not configured");
  }

  const today = new Date().toISOString().split("T")[0];

  const response = await anthropicClient.messages.create({
    model: anthropicModel,
    max_tokens: 256,
    temperature: 0,
    system: buildSystemPrompt(today),
    messages: [
      {
        role: "user",
        content: inputText,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const rawText = content.text.trim();
  const jsonText = extractJsonObject(rawText);

  const parsed = JSON.parse(jsonText);
  const validated = aiInterpretationSchema.parse(parsed);

  return validated;
}

function buildProposedAction(
  interpretation: AIInterpretation
): ProposedAction | null {
  if (interpretation.intent === "none" || !interpretation.payload) {
    return null;
  }

  const intent = interpretation.intent;
  const payload = interpretation.payload;

  if (isAIFinancialPayload(payload)) {
    return {
      intent,
      confidence: interpretation.confidence,
      payload: {
        type: payload.type,
        amount: payload.amount,
        category: payload.category,
        description: payload.description,
        date: payload.date,
      },
      missing_fields: interpretation.missing_fields,
    };
  }

  return {
    intent,
    confidence: interpretation.confidence,
    payload: {
      legal_type: payload.legal_type,
      description: payload.description,
      date: payload.date,
    },
    missing_fields: interpretation.missing_fields,
  };
}

export async function interpretUserAction(
  inputText: string
): Promise<InterpretResult> {
  if (!anthropicClient) {
    const response = detectAction(inputText)
      ? getActionResponse(detectAction(inputText)!)
      : getMockResponse(inputText);
    return {
      response,
      model_used: "mock-regex",
      interpreter: "fallback",
    };
  }

  try {
    const interpretation = await callClaude(inputText);

    if (interpretation.intent === "none") {
      const response: ChatResponse = {
        message:
          interpretation.message ||
          "Entiendo. ¿Puedes darme más detalles sobre lo que necesitas?",
      };
      return {
        response,
        model_used: anthropicModel,
        interpreter: "claude",
      };
    }

    const proposedAction = buildProposedAction(interpretation);
    if (!proposedAction) {
      throw new Error("Claude returned valid intent but missing payload");
    }

    const response = getActionResponse(proposedAction);
    return {
      response,
      model_used: anthropicModel,
      interpreter: "claude",
    };
  } catch (error) {
    // Cualquier error de Claude → fallback regex
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn("Claude interpretation failed, falling back to regex:", message);

    const response = detectAction(inputText)
      ? getActionResponse(detectAction(inputText)!)
      : getMockResponse(inputText);
    return {
      response,
      model_used: "mock-regex",
      interpreter: "fallback",
    };
  }
}
