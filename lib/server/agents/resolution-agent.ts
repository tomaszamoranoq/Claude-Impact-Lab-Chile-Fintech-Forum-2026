import { SkeletonAgent } from "./skeleton-agent";

export class ResolutionAgent extends SkeletonAgent {
  protected readonly name = "resolution" as const;

  protected getFriendlyMessage(): string {
    return "Detecté que esto corresponde al cierre de empresa, pero ese agente aún está en desarrollo.";
  }
}
