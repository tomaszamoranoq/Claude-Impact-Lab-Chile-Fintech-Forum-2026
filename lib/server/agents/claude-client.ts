import Anthropic from "@anthropic-ai/sdk";
import { anthropicClient, anthropicModel } from "@/lib/server/anthropic";

export interface ClaudeToolDefinition {
  name: string;
  description: string;
  input_schema: Anthropic.Tool.InputSchema;
}

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export async function callClaudeToolUse<T>(
  systemPrompt: string,
  messages: ClaudeMessage[],
  tool: ClaudeToolDefinition,
  toolName: string,
  maxTokens = 1024
): Promise<T> {
  if (!anthropicClient) {
    throw new Error("Anthropic client not configured");
  }

  const response = await anthropicClient.messages.create({
    model: anthropicModel,
    max_tokens: maxTokens,
    temperature: 0,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    tools: [
      {
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
      },
    ],
    tool_choice: { type: "tool", name: toolName },
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(`Claude did not use the expected tool: ${toolName}`);
  }

  return toolUse.input as T;
}
