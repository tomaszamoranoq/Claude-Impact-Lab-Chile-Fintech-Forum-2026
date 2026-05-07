import { KnowledgeQuery, KnowledgeResponse } from "../../types";

export class McpKnowledgeClient {
  private serverUrl: string;

  constructor(config: { serverUrl: string }) {
    this.serverUrl = config.serverUrl;
  }

  async query(query: KnowledgeQuery): Promise<KnowledgeResponse> {
    // 5C: aquí se conectará al MCP server vía stdio o HTTP
    throw new Error(
      `MCP knowledge client not implemented yet. ` +
        `Would connect to ${this.serverUrl} for topic: ${query.topic}`
    );
  }
}
