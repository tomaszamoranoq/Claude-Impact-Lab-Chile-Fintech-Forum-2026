import { LaunchAgent } from "./launch-agent";
import { OperationsAgent } from "./operations-agent";
import { DocumentsAgent } from "./documents-agent";
import { ComplianceAgent } from "./compliance-agent";
import { LaborAgent } from "./labor-agent";
import { ResolutionAgent } from "./resolution-agent";
import { AgentContext, AgentOutput, AgentName } from "./types";

export class AgentRouter {
  async dispatch(
    agentName: AgentName,
    context: AgentContext
  ): Promise<AgentOutput<unknown>> {
    switch (agentName) {
      case "launch":
        return new LaunchAgent().run(context);
      case "operations":
        return new OperationsAgent().run(context);
      case "documents":
        return new DocumentsAgent().run(context);
      case "compliance":
        return new ComplianceAgent().run(context);
      case "labor":
        return new LaborAgent().run(context);
      case "resolution":
        return new ResolutionAgent().run(context);
      default:
        return {
          success: false,
          error: `Unknown agent: ${agentName}`,
          warnings: [],
          model_used: "invalid-agent",
        };
    }
  }
}
