import { NextRequest, NextResponse } from "next/server";
import { AgentRouter } from "@/lib/server/agents/agent-router";
import { IntentClassifier } from "@/lib/server/agents/intent-classifier";
import { AgentName, AgentContext, AgentRoutingMetadata } from "@/lib/server/agents/types";

const VALID_AGENTS: AgentName[] = [
  "launch",
  "operations",
  "documents",
  "compliance",
  "labor",
  "resolution",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input_text, agent_name, company_id, user_id, mode } = body;

    // 1. Validar mode si viene presente
    if (mode !== undefined && mode !== "chat" && mode !== "execute") {
      const routing: AgentRoutingMetadata = {
        selected_agent: null,
        confidence: 0,
        reason: "mode inválido.",
        classifier_model: "none",
        classifier_used: "manual",
      };
      return NextResponse.json(
        {
          success: false,
          error: `Invalid mode: "${mode}". Must be "chat" or "execute".`,
          warnings: [],
          model_used: "invalid-request",
          routing,
        },
        { status: 400 }
      );
    }

    const context: AgentContext = {
      inputText: input_text,
      companyId: company_id || "mock-company-1",
      userId: user_id || "mock-user-1",
      mode: mode === "chat" || mode === "execute" ? mode : undefined,
    };

    // 2. Validar input_text
    if (!input_text || typeof input_text !== "string") {
      const routing: AgentRoutingMetadata = {
        selected_agent: null,
        confidence: 0,
        reason: "input_text faltante.",
        classifier_model: "none",
        classifier_used: "manual",
      };
      return NextResponse.json(
        {
          success: false,
          error: "El campo 'input_text' es obligatorio.",
          warnings: [],
          model_used: "invalid-request",
          routing,
        },
        { status: 400 }
      );
    }

    // 3. Validar agent_name si viene explícito
    if (agent_name !== undefined && !VALID_AGENTS.includes(agent_name)) {
      const routing: AgentRoutingMetadata = {
        selected_agent: null,
        confidence: 0,
        reason: "agent_name inválido.",
        classifier_model: "none",
        classifier_used: "manual",
      };
      return NextResponse.json(
        {
          success: false,
          error: `Invalid agent_name: ${agent_name}`,
          warnings: [`Agent name must be one of: ${VALID_AGENTS.join(", ")}.`],
          model_used: "invalid-agent",
          routing,
        },
        { status: 400 }
      );
    }

    // 4. Decidir agente y construir routing
    let selectedAgent: AgentName;
    let routing: AgentRoutingMetadata;

    const router = new AgentRouter();

    if (agent_name) {
      // Dispatch manual
      selectedAgent = agent_name;
      routing = {
        selected_agent: selectedAgent,
        confidence: 1,
        reason: "Agente seleccionado explícitamente por el request.",
        classifier_model: "manual",
        classifier_used: "manual",
      };
    } else {
      // Dispatch inteligente con clasificador
      const classifier = new IntentClassifier();
      const result = await classifier.classify(context);
      selectedAgent = result.classification.agent_name;
      routing = {
        selected_agent: selectedAgent,
        confidence: result.classification.confidence,
        reason: result.classification.reason,
        classifier_model: result.classifier_model,
        classifier_used: result.classifier_used,
      };
    }

    // 5. Guard: mode "chat" + launch + baja confianza → mensaje conversacional
    const launchGuardThreshold = 0.65;
    if (
      context.mode === "chat" &&
      selectedAgent === "launch" &&
      routing.confidence < launchGuardThreshold
    ) {
      return NextResponse.json(
        {
          success: true,
          data: {
            message:
              "Para generar tu hoja de ruta necesito más información sobre tu negocio. " +
              "¿Puedes contarme el rubro, la comuna y si tendrás socios?",
            agent: "launch",
            model_used: "launch-guard",
            warnings: [],
          },
          model_used: "launch-guard",
          routing,
        },
        { status: 200 }
      );
    }

    // 6. Ejecutar agente
    const result = await router.dispatch(selectedAgent, context);

    if (!result.success) {
      const status =
        result.model_used === "not-implemented"
          ? 501
          : result.model_used === "invalid-agent"
            ? 400
            : 500;
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Error desconocido",
          warnings: result.warnings,
          model_used: result.model_used,
          routing,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        warnings: result.warnings,
        model_used: result.model_used,
        routing,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const routing: AgentRoutingMetadata = {
      selected_agent: null,
      confidence: 0,
      reason: "Error inesperado en el servidor.",
      classifier_model: "none",
      classifier_used: "manual",
    };
    return NextResponse.json(
      {
        success: false,
        error: message,
        warnings: ["Error inesperado en el endpoint de agentes."],
        model_used: "error",
        routing,
      },
      { status: 500 }
    );
  }
}
