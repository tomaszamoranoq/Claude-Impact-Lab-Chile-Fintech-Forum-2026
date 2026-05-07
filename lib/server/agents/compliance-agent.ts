import { SkeletonAgent } from "./skeleton-agent";

export class ComplianceAgent extends SkeletonAgent {
  protected readonly name = "compliance" as const;

  protected getFriendlyMessage(): string {
    return "Detecté que esto corresponde a cumplimiento tributario o legal, pero ese agente aún está en desarrollo. Puedes revisar la sección Cumplimiento mientras tanto.";
  }
}
