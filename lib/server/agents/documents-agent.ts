import { SkeletonAgent } from "./skeleton-agent";

export class DocumentsAgent extends SkeletonAgent {
  protected readonly name = "documents" as const;

  protected getFriendlyMessage(): string {
    return "Detecté que esto corresponde a documentos, pero ese agente conversacional aún está en desarrollo. Puedes usar el módulo Documentos para cargar y analizar archivos.";
  }
}
