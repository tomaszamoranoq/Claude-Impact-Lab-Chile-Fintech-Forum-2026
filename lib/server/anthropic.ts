import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

export const anthropicModel =
  process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";

export const anthropicClient: Anthropic | null = apiKey
  ? new Anthropic({ apiKey })
  : null;
