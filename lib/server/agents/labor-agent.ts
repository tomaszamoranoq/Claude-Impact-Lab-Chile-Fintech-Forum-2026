import { SkeletonAgent } from "./skeleton-agent";

export class LaborAgent extends SkeletonAgent {
  protected readonly name = "labor" as const;

  protected getFriendlyMessage(): string {
    return "Detecté que esto corresponde a temas laborales, pero ese agente aún está en desarrollo.";
  }
}
