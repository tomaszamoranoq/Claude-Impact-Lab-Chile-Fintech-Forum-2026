import { SkeletonAgent } from "./skeleton-agent";

export class OperationsAgent extends SkeletonAgent {
  protected readonly name = "operations" as const;

  protected getFriendlyMessage(): string {
    return "Detecté que esto corresponde a operaciones de caja, pero ese agente aún está en desarrollo. Por ahora puedo ayudarte con diagnóstico inicial y hoja de ruta.";
  }
}
