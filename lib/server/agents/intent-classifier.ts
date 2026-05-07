import { callClaudeToolUse } from "./claude-client";
import {
  AgentContext,
  IntentClassificationResult,
} from "./types";
import { classifyWithRegex } from "./intent-classifier-fallback";
import { anthropicClient, anthropicModel } from "@/lib/server/anthropic";
import { intentClassificationSchema } from "@/lib/schemas";

const CLASSIFICATION_TOOL = {
  name: "emit_intent_classification",
  description:
    "Classify user intent into one of six business domains for Chilean microenterprises. Only classify, do not execute actions.",
  input_schema: {
    type: "object" as const,
    properties: {
      agent_name: {
        type: "string",
        enum: ["launch", "operations", "documents", "compliance", "labor", "resolution"],
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
      },
      reason: { type: "string" },
      missing_context: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["agent_name", "confidence", "reason", "missing_context"],
  },
};

const SYSTEM_PROMPT = `Eres un clasificador de intenciones para microempresas chilenas. Tu única tarea es clasificar el input del usuario en uno de estos 6 dominios:

- launch: crear empresa, elegir figura legal, empezar negocio, roadmap, primeros pasos, constitución, permisos para abrir un negocio nuevo.
- operations: ingresos, egresos, pagos, ventas, facturas pagadas, boletas pagadas, caja, IVA proyectado, operaciones diarias, movimientos de dinero.
- documents: subir, cargar, adjuntar, analizar, clasificar o revisar documentos, PDFs, fotos, imágenes, archivos escaneados.
- compliance: fechas de vencimiento, obligaciones tributarias recurrentes, F29, F22, IVA, impuestos, patente (renovación), SII, Previred, calendario de obligaciones.
- labor: trabajadores, contratos, sueldos, liquidaciones, jornada, imposiciones, contratación.
- resolution: cerrar empresa, disolver sociedad, término de giro, deudas, cierre, liquidar empresa.

DISTINCIONES CLAVE:
1. "subí una factura pdf" → documents (acción sobre archivo), NO operations.
2. "pagué factura de luz" → operations (movimiento de caja), NO documents.
3. "tengo una factura escaneada y quiero revisarla" → documents (revisar archivo), NO operations.
4. "cuándo vence el IVA" → compliance (obligación recurrente), NO launch.
5. "necesito permisos para abrir panadería" → launch (constitución), NO compliance.
6. "renovar patente municipal" → compliance (recurrente), NO launch.

REGLAS:
1. No ejecutes acciones, solo clasifica.
2. Si el input es ambiguo, elige el dominio más probable y explica por qué.
3. Si falta contexto crucial, indícalo en missing_context. Ejemplos de contexto faltante: monto, fecha, comuna, tipo de documento, estado de pago, cantidad de trabajadores, figura legal actual.
4. Devuelve SIEMPRE un agent_name válido.
5. confidence debe reflejar tu certeza real (0.0 a 1.0).`;

export class IntentClassifier {
  async classify(context: AgentContext): Promise<IntentClassificationResult> {
    if (!anthropicClient) {
      return this.fallback(context.inputText);
    }

    try {
      const raw = await callClaudeToolUse<Record<string, unknown>>(
        SYSTEM_PROMPT,
        [{ role: "user", content: context.inputText }],
        CLASSIFICATION_TOOL,
        "emit_intent_classification",
        256
      );

      const parsed = intentClassificationSchema.parse(raw);

      return {
        classification: {
          agent_name: parsed.agent_name,
          confidence: parsed.confidence,
          reason: parsed.reason,
          missing_context: parsed.missing_context,
        },
        classifier_used: "claude",
        classifier_model: anthropicModel,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn("IntentClassifier Claude failed, using fallback:", message);
      return this.fallback(context.inputText);
    }
  }

  private fallback(inputText: string): IntentClassificationResult {
    const classification = classifyWithRegex(inputText);
    return {
      classification,
      classifier_used: "fallback-regex",
      classifier_model: "fallback-regex",
    };
  }
}
