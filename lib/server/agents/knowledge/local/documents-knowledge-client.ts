import { KnowledgeQuery, KnowledgeResponse } from "../../types";

const DOCUMENTS_GUIDE = `
GESTIÓN DOCUMENTAL PYME (Chile):
- Documentos legales: escrituras, contratos, poderes.
- Documentos tributarios: F29, F22, certificados SII.
- Documentos laborales: contratos, finiquitos, liquidaciones.
- Almacenamiento organizado por carpeta: legal, tributario, rrhh, operaciones.
`;

export class DocumentsKnowledgeClient {
  async query(_query: KnowledgeQuery): Promise<KnowledgeResponse> {
    return {
      content: DOCUMENTS_GUIDE,
      sources: ["SII Chile", "Dirección del Trabajo"],
    };
  }
}
