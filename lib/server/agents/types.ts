import { AgentMode } from "@/lib/schemas";

export type AgentName =
  | "launch"
  | "operations"
  | "documents"
  | "compliance"
  | "labor"
  | "resolution";

export interface AgentCapability {
  name: string;
  description: string;
}

export interface AgentContext {
  companyId: string;
  userId: string;
  inputText: string;
  mode?: AgentMode;
  previousMessages?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface AgentOutput<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warnings: string[];
  model_used: string;
}

// Backward-compatible aliases for existing code (deprecated, use AgentContext/AgentOutput)
export interface AgentRunOptions {
  inputText: string;
  companyId?: string;
  userId?: string;
}

export interface AgentRunOutput {
  success: boolean;
  data?: unknown;
  error?: string;
  warnings: string[];
}

export interface KnowledgeQueryContext {
  hasPartners?: boolean;
  stage?: string;
  industry?: string;
  municipality?: string;
  plansToHire?: boolean | "unknown";
}

export interface KnowledgeQuery {
  topic: string;
  context?: KnowledgeQueryContext;
}

export interface KnowledgeResponse {
  content: string;
  sources: string[];
}

export interface KnowledgeClient {
  query(query: KnowledgeQuery): Promise<KnowledgeResponse>;
}

// ------------------------------------------------------------------
// Tipos para clasificación de intenciones (Fase 5C)
// ------------------------------------------------------------------

export interface IntentClassification {
  agent_name: AgentName;
  confidence: number;
  reason: string;
  missing_context: string[];
}

export interface IntentClassificationResult {
  classification: IntentClassification;
  classifier_used: "claude" | "fallback-regex";
  classifier_model: string;
}

export interface AgentRoutingMetadata {
  selected_agent: AgentName | null;
  confidence: number;
  reason: string;
  classifier_model: string;
  classifier_used: string;
}
