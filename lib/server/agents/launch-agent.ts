import {
  launchAgentResultSchema,
  LaunchAgentResult,
  createBusinessDiagnosisInputSchema,
  lifecycleStageSchema,
  legalTypeRecommendationSchema,
  RoadmapItem,
} from "@/lib/schemas";
import { LaunchKnowledgeClient } from "./knowledge/local/launch-knowledge-client";
import { McpKnowledgeClient } from "./knowledge/mcp/mcp-knowledge-client";
import {
  AgentContext,
  AgentOutput,
  AgentRunOptions,
  AgentRunOutput,
} from "./types";
import { BaseAgent } from "./base-agent";
import { createBusinessDiagnosis, getLatestDiagnosisWithRoadmap, updateBusinessDiagnosis } from "@/lib/server/business-diagnoses";
import { createRoadmapItems, deleteRoadmapItemsByDiagnosis } from "@/lib/server/roadmap-items";
import { z } from "zod";
import { safeParseRoadmapItems, buildDefaultRoadmapItems } from "./utils/roadmap-utils";

const LAUNCH_TOOL = {
  name: "emit_launch_diagnosis",
  description:
    "Emit a structured business diagnosis and personalized roadmap for a Chilean microenterprise. Only call this when the user describes a business idea or context.",
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
          has_partners: {
            anyOf: [
              { type: "boolean" },
              { type: "string", enum: ["unknown"] },
            ],
          },
          partners_count: { type: "integer", minimum: 0 },
          plans_to_hire: {
            anyOf: [
              { type: "boolean" },
              { type: "string", enum: ["unknown"] },
            ],
          },
          operates_from_home: {
            anyOf: [
              { type: "boolean" },
              { type: "string", enum: ["unknown"] },
            ],
          },
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
        enum: ["Empresario Individual", "EIRL", "SpA", "unknown"],
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
      assumptions: { type: "array", items: { type: "string" } },
      unknowns: { type: "array", items: { type: "string" } },
      next_steps: { type: "array", items: { type: "string" } },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
      },
      roadmap_items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            stage: {
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
            title: { type: "string" },
            description: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed", "blocked"],
            },
            due_date: { type: "string" },
            source_name: { type: "string" },
            source_url: { type: "string" },
            sort_order: { type: "integer" },
          },
          required: ["stage", "title", "description"],
        },
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
      "roadmap_items",
    ],
  },
};

function buildSystemPrompt(knowledgeContent: string): string {
  return `Eres un asistente de diagnóstico y planificación para microempresas chilenas.

CONOCIMIENTO CONTEXTUAL:
${knowledgeContent}

REGLAS:
1. No inventes datos. Si falta información, usa "unknown" u omite campos opcionales.
2. No das asesoría legal definitiva. Propones, no decides.
3. Conserva la riqueza del caso en business_description, notes, assumptions, unknowns.
4. partners_count significa número total de personas dueñas/socias, incluyendo al usuario.
5. Si el usuario dice "con mi hermano", "con mi socio", "con mi pareja" u otra persona, has_partners debe ser true.
6. Si hay exactamente una persona adicional al usuario, partners_count debe ser 2.
7. Si has_partners es true, recommended_legal_type debe ser "SpA" o "unknown", nunca "EIRL" ni "Empresario Individual".
8. next_steps debe incluir 3 a 5 pasos concretos y breves.
9. roadmap_items debe incluir entre 5 y 10 tareas agrupadas por etapa (exploration, constitution, tax_start, operation, hiring, regularization, closing).
10. Cada roadmap_item debe tener title, description, stage y opcionalmente status, due_date, source_name, source_url.
11. sort_order debe reflejar el orden lógico de ejecución.

Debes invocar obligatoriamente la herramienta emit_launch_diagnosis.`;
}

function normalizeLaunchResult(
  raw: Record<string, unknown>,
  inputText: string
): LaunchAgentResult {
  const assumptions = Array.isArray(raw.assumptions)
    ? raw.assumptions as string[]
    : [];
  const nextSteps = Array.isArray(raw.next_steps)
    ? raw.next_steps as string[]
    : [];

  const businessProfile = raw.business_profile as Record<string, unknown>;

  // Regla: socios + figura legal inconsistente
  let legalType = raw.recommended_legal_type as string;
  const hasPartners = businessProfile?.has_partners;
  if (
    hasPartners === true &&
    (legalType === "EIRL" || legalType === "Empresario Individual")
  ) {
    legalType = "SpA";
    assumptions.push(
      "Al existir socios, se ajusta la recomendación a SpA porque EIRL y Empresario Individual son figuras de un solo titular."
    );
  }

  // Regla: partners_count faltante
  const partnerKeywords = /hermano|socio|pareja|amigo|con mi/i;
  let partnersCount = businessProfile?.partners_count as number | undefined;
  if (
    hasPartners === true &&
    (typeof partnersCount !== "number" || partnersCount < 2)
  ) {
    if (partnerKeywords.test(inputText)) {
      partnersCount = 2;
      assumptions.push(
        "Se interpreta la mención de otra persona como dos socios totales incluyendo al usuario."
      );
    }
  }

  // Regla: next_steps vacío
  if (nextSteps.length === 0) {
    nextSteps.push(
      "Confirmar socios, aportes y roles.",
      "Elegir figura legal preliminar.",
      "Preparar constitución en Empresa en un Día.",
      "Revisar permisos municipales y sanitarios aplicables.",
      "Planificar inicio de actividades ante SII."
    );
  }

  const normalizedProfile = {
    ...businessProfile,
    partners_count: partnersCount,
  };

  // Parsear roadmap items con defensa en profundidad
  const { items: roadmapItems, warnings: roadmapWarnings } = safeParseRoadmapItems(
    raw.roadmap_items
  );

  return {
    diagnosis: {
      input_text: inputText,
      business_profile: normalizedProfile as z.infer<typeof createBusinessDiagnosisInputSchema>["business_profile"],
      recommended_legal_type: legalType as z.infer<typeof legalTypeRecommendationSchema>,
      lifecycle_stage: raw.lifecycle_stage as z.infer<typeof lifecycleStageSchema>,
      assumptions,
      unknowns: Array.isArray(raw.unknowns) ? raw.unknowns as string[] : [],
      next_steps: nextSteps,
      confidence: typeof raw.confidence === "number" ? raw.confidence : 0.7,
      model_used: "claude",
    },
    roadmap_items: roadmapItems,
    message: String(raw.message || "Diagnóstico completado."),
    model_used: "claude",
    warnings: roadmapWarnings,
  };
}

function buildFallbackResult(inputText: string): LaunchAgentResult {
  return {
    diagnosis: {
      input_text: inputText,
      business_profile: {
        business_activity_category: "other",
        business_description: inputText,
        has_partners: "unknown",
        plans_to_hire: "unknown",
        operates_from_home: "unknown",
      },
      recommended_legal_type: "unknown",
      lifecycle_stage: "exploration",
      assumptions: [
        "No se pudo procesar con Claude; se usa fallback determinístico.",
      ],
      unknowns: [
        "Rubro, comuna, socios, contratación y domicilio operativo.",
      ],
      next_steps: [
        "Confirmar socios, aportes y roles.",
        "Elegir figura legal preliminar.",
        "Preparar constitución en Empresa en un Día.",
        "Revisar permisos municipales y sanitarios aplicables.",
        "Planificar inicio de actividades ante SII.",
      ],
      confidence: 0.3,
      model_used: "fallback-deterministic",
    },
    roadmap_items: buildDefaultRoadmapItems(),
    message:
      "Claude no está disponible o la salida fue inválida. Se usó fallback determinístico. Por favor, revisa los datos.",
    model_used: "fallback-deterministic",
    warnings: [
      "Claude no disponible o salida inválida; se usó fallback determinístico.",
    ],
  };
}

export class LaunchAgent extends BaseAgent<LaunchAgentResult> {
  protected readonly name = "launch" as const;
  protected readonly domain = "business_formation";
  protected readonly capabilities = [
    { name: "diagnosis", description: "Genera diagnóstico de negocio" },
    { name: "roadmap", description: "Genera hoja de ruta personalizada" },
  ];
  protected readonly knowledgeClient = new McpKnowledgeClient({
    serverUrl: process.env.MCP_LAUNCH_URL,
    searchToolName: "search_launch_knowledge",
    sourceName: "MCP Launch",
    fallbackClient: new LaunchKnowledgeClient(),
  });

  private lastDiagnosisId?: string;
  private lastRoadmapItems?: RoadmapItem[];

  protected buildTool() {
    return LAUNCH_TOOL;
  }

  protected buildSystemPrompt(knowledge: { content: string }) {
    return buildSystemPrompt(knowledge.content);
  }

  protected normalizeResult(raw: Record<string, unknown>, inputText: string): LaunchAgentResult {
    return normalizeLaunchResult(raw, inputText);
  }

  protected getOutputSchema() {
    return launchAgentResultSchema;
  }

  protected async persist(result: LaunchAgentResult, context: AgentContext): Promise<void> {
    const mode = context.mode ?? "execute";

    if (mode === "chat") {
      // Solo reutilizar diagnóstico que ya tenga roadmap_items asociados
      const existingDiagnosis = await getLatestDiagnosisWithRoadmap(context.companyId, 24);

      if (existingDiagnosis) {
        // DEBT: sin transacción SQL. Si falla a mitad, puede haber inconsistencia.
        // 1. Actualizar diagnóstico
        await updateBusinessDiagnosis(existingDiagnosis.id, {
          input_text: result.diagnosis.input_text,
          business_profile: result.diagnosis.business_profile,
          recommended_legal_type: result.diagnosis.recommended_legal_type,
          lifecycle_stage: result.diagnosis.lifecycle_stage,
          assumptions: result.diagnosis.assumptions,
          unknowns: result.diagnosis.unknowns,
          next_steps: result.diagnosis.next_steps,
          confidence: result.diagnosis.confidence,
          model_used: result.diagnosis.model_used,
        });
        // 2. Borrar roadmap_items anteriores
        await deleteRoadmapItemsByDiagnosis(existingDiagnosis.id);
        // 3. Insertar roadmap_items nuevos
        this.lastDiagnosisId = existingDiagnosis.id;
        this.lastRoadmapItems = await createRoadmapItems(
          result.roadmap_items,
          context.companyId,
          existingDiagnosis.id
        );
        return;
      }
    }

    const diagnosis = await createBusinessDiagnosis({
      ...result.diagnosis,
      company_id: context.companyId,
      user_id: context.userId,
    });
    this.lastDiagnosisId = diagnosis.id;
    this.lastRoadmapItems = await createRoadmapItems(
      result.roadmap_items,
      context.companyId,
      diagnosis.id
    );
  }

  protected buildFallbackResult(inputText: string): LaunchAgentResult {
    return buildFallbackResult(inputText);
  }

  async run(context: AgentContext): Promise<AgentOutput<LaunchAgentResult & { diagnosis_id: string; roadmap_items: RoadmapItem[] }>> {
    const output = await super.run(context);
    if (!output.success || !output.data) {
      return output as AgentOutput<LaunchAgentResult & { diagnosis_id: string; roadmap_items: RoadmapItem[] }>;
    }
    if (!this.lastDiagnosisId) {
      throw new Error("LaunchAgent persist did not set diagnosis_id");
    }
    if (!this.lastRoadmapItems) {
      throw new Error("LaunchAgent persist did not set roadmap_items");
    }
    return {
      ...output,
      data: {
        ...output.data,
        diagnosis_id: this.lastDiagnosisId,
        roadmap_items: this.lastRoadmapItems,
      },
    };
  }

  // Backward-compatible wrapper for existing endpoints
  async runLegacy(options: AgentRunOptions): Promise<AgentRunOutput> {
    const output = await this.run({
      companyId: options.companyId || "mock-company-1",
      userId: options.userId || "mock-user-1",
      inputText: options.inputText,
    });
    return {
      success: output.success,
      data: output.data,
      error: output.error,
      warnings: output.warnings,
    };
  }
}
