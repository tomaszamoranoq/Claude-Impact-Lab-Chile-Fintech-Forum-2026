import { z } from "zod";
import {
  AgentName,
  AgentCapability,
  AgentContext,
  AgentOutput,
  KnowledgeClient,
  KnowledgeQuery,
  KnowledgeResponse,
} from "./types";
import { ClaudeToolDefinition, ClaudeMessage, callClaudeToolUse } from "./claude-client";
import { supabase } from "@/lib/server/supabase";

export abstract class BaseAgent<TOutput = unknown> {
  protected abstract readonly name: AgentName;
  protected abstract readonly domain: string;
  protected abstract readonly capabilities: AgentCapability[];
  protected abstract readonly knowledgeClient: KnowledgeClient;

  protected abstract buildTool(): ClaudeToolDefinition;
  protected abstract buildSystemPrompt(knowledge: KnowledgeResponse): string;
  protected abstract normalizeResult(
    raw: Record<string, unknown>,
    inputText: string
  ): TOutput;
  protected abstract getOutputSchema(): z.ZodType<TOutput>;
  protected abstract persist(
    result: TOutput,
    context: AgentContext
  ): Promise<void>;

  protected buildFallbackResult(_inputText: string): TOutput {
    throw new Error("Fallback not implemented");
  }

  protected async buildAdditionalContext(_context: AgentContext): Promise<string> {
    return "";
  }

  protected async fetchCompanyContext(
    companyId: string
  ): Promise<Record<string, unknown> | null> {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();
    return (data as Record<string, unknown> | null) ?? null;
  }

  protected buildKnowledgeQuery(
    company: Record<string, unknown> | null,
    _context: AgentContext
  ): KnowledgeQuery {
    return {
      topic: "general",
      context: {
        hasPartners: company?.has_partners as boolean | undefined,
        stage: company?.lifecycle_stage as string | undefined,
        industry: company?.industry as string | undefined,
        municipality: company?.municipality as string | undefined,
        plansToHire: company?.plans_to_hire as boolean | "unknown" | undefined,
      },
    };
  }

  protected async callClaude(
    systemPrompt: string,
    messages: ClaudeMessage[],
    tool: ClaudeToolDefinition,
    toolName: string,
    maxTokens = 1024
  ): Promise<Record<string, unknown>> {
    return callClaudeToolUse<Record<string, unknown>>(
      systemPrompt,
      messages,
      tool,
      toolName,
      maxTokens
    );
  }

  async run(context: AgentContext): Promise<AgentOutput<TOutput>> {
    try {
      // 1. Obtener contexto empresa
      const company = await this.fetchCompanyContext(context.companyId);

      // 2. Obtener conocimiento
      const knowledgeQuery = this.buildKnowledgeQuery(company, context);
      const knowledge = await this.knowledgeClient.query(knowledgeQuery);

      // 3. Construir prompt
      const systemPrompt = this.buildSystemPrompt(knowledge);
      const additionalContext = await this.buildAdditionalContext(context);
      const userMessage = this.buildUserMessage(company, context.inputText, additionalContext);

      // 4. Llamar Claude
      const tool = this.buildTool();
      const raw = await this.callClaude(
        systemPrompt,
        [{ role: "user", content: userMessage }],
        tool,
        tool.name
      );

      // 5. Normalizar
      const normalized = this.normalizeResult(raw, context.inputText);

      // 6. Validar con Zod
      const schema = this.getOutputSchema();
      const validated = schema.parse(normalized);

      // 7. Persistir
      await this.persist(validated, context);

      return {
        success: true,
        data: validated,
        warnings: [],
        model_used: "claude",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn(`${this.name} agent failed:`, message);

      try {
        const fallback = this.buildFallbackResult(context.inputText);
        await this.persist(fallback, context);
        return {
          success: true,
          data: fallback,
          warnings: [
            "Claude no disponible o salida inválida; se usó fallback determinístico.",
          ],
          model_used: "fallback-deterministic",
        };
      } catch (persistError) {
        const persistMessage =
          persistError instanceof Error
            ? persistError.message
            : "Unknown persist error";
        return {
          success: false,
          error: `Fallback persist failed: ${persistMessage}. Original error: ${message}`,
          warnings: [
            "Claude no disponible o salida inválida; se usó fallback determinístico.",
          ],
          model_used: "fallback-deterministic",
        };
      }
    }
  }

  protected buildUserMessage(
    company: Record<string, unknown> | null,
    inputText: string,
    additionalContext?: string
  ): string {
    const base = `Contexto de la empresa:\nNombre: ${company?.legal_name || "No disponible"}\nRubro: ${company?.industry || "No disponible"}\nComuna: ${company?.municipality || "No disponible"}\n\nInput del usuario:\n${inputText}`;
    return additionalContext ? `${base}\n\n${additionalContext}` : base;
  }
}
