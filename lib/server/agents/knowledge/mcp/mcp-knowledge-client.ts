import {
  KnowledgeClient,
  KnowledgeQuery,
  KnowledgeResponse,
} from "../../types";

type McpTextContent = {
  type: "text";
  text: string;
};

type McpToolCallResponse = {
  result?: {
    content?: McpTextContent[];
    isError?: boolean;
  };
  error?: {
    message?: string;
  };
};

function normalizeMcpUrl(serverUrl: string): string {
  const cleanUrl = serverUrl.trim().replace(/\/+$/, "");
  return cleanUrl.endsWith("/mcp") ? cleanUrl : `${cleanUrl}/mcp`;
}

function buildContextNotes(query: KnowledgeQuery): string {
  const notes: string[] = [];
  const context = query.context;

  if (context?.stage) notes.push(`Etapa: ${context.stage}`);
  if (context?.industry) notes.push(`Rubro: ${context.industry}`);
  if (context?.municipality) notes.push(`Comuna: ${context.municipality}`);
  if (typeof context?.hasPartners === "boolean") {
    notes.push(`Tiene socios: ${context.hasPartners ? "si" : "no"}`);
  }
  if (context?.plansToHire !== undefined) {
    notes.push(`Planea contratar: ${String(context.plansToHire)}`);
  }

  return notes.length > 0 ? `\nContexto empresa: ${notes.join(", ")}` : "";
}

function extractResponseText(response: McpToolCallResponse): string {
  if (response.error) {
    throw new Error(response.error.message || "MCP server returned an error");
  }

  if (response.result?.isError) {
    throw new Error("MCP tool returned an error result");
  }

  const text = response.result?.content
    ?.filter((item): item is McpTextContent => item.type === "text")
    .map((item) => item.text)
    .join("\n\n")
    .trim();

  if (!text) {
    throw new Error("MCP tool returned no text content");
  }

  return text;
}

export class McpKnowledgeClient implements KnowledgeClient {
  private serverUrl?: string;
  private searchToolName: string;
  private sourceName: string;
  private fallbackClient: KnowledgeClient;

  constructor(config: {
    serverUrl?: string;
    searchToolName: string;
    sourceName: string;
    fallbackClient: KnowledgeClient;
  }) {
    this.serverUrl = config.serverUrl;
    this.searchToolName = config.searchToolName;
    this.sourceName = config.sourceName;
    this.fallbackClient = config.fallbackClient;
  }

  async query(query: KnowledgeQuery): Promise<KnowledgeResponse> {
    if (!this.serverUrl) {
      return this.fallbackClient.query(query);
    }

    try {
      const response = await fetch(normalizeMcpUrl(this.serverUrl), {
        method: "POST",
        headers: {
          Accept: "application/json, text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "tools/call",
          params: {
            name: this.searchToolName,
            arguments: {
              query: `${query.topic}${buildContextNotes(query)}`,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`MCP request failed with HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Unsupported MCP response type: ${contentType}`);
      }

      const payload = (await response.json()) as McpToolCallResponse;
      return {
        content: extractResponseText(payload),
        sources: [this.sourceName],
      };
    } catch (error) {
      console.warn(
        `MCP knowledge unavailable for ${this.sourceName}; using local fallback:`,
        error instanceof Error ? error.message : "Unknown error"
      );
      return this.fallbackClient.query(query);
    }
  }
}
