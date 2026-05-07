import { z } from "zod";
import { BaseAgent } from "./base-agent";
import {
  AgentContext,
  AgentOutput,
  AgentCapability,
  KnowledgeClient,
  KnowledgeQuery,
  KnowledgeResponse,
} from "./types";
import { ClaudeToolDefinition } from "./claude-client";

class DummyKnowledgeClient implements KnowledgeClient {
  async query(_query: KnowledgeQuery): Promise<KnowledgeResponse> {
    return { content: "", sources: [] };
  }
}

export abstract class SkeletonAgent extends BaseAgent<Record<string, unknown>> {
  protected readonly knowledgeClient = new DummyKnowledgeClient();
  protected readonly domain = "not-implemented";
  protected readonly capabilities: AgentCapability[] = [];

  protected buildTool(): ClaudeToolDefinition {
    return {
      name: "noop",
      description: "No operation",
      input_schema: { type: "object", properties: {} },
    };
  }

  protected buildSystemPrompt(): string {
    return "";
  }

  protected normalizeResult(): Record<string, unknown> {
    return {};
  }

  protected getOutputSchema() {
    return z.record(z.string(), z.unknown());
  }

  protected async persist(): Promise<void> {
    // noop
  }

  protected getFriendlyMessage(): string {
    return `Detecté que esto corresponde a ${this.domain}, pero ese agente aún está en desarrollo.`;
  }

  async run(_context: AgentContext): Promise<AgentOutput<Record<string, unknown>>> {
    return {
      success: false,
      error: this.getFriendlyMessage(),
      warnings: [
        "Este agente está en desarrollo. Usa el agente de lanzamiento para operaciones de constitución.",
      ],
      model_used: "not-implemented",
    };
  }
}
