import { KnowledgeQuery, KnowledgeResponse } from "../../types";

const LABOR_GUIDE = `
GESTIÓN LABORAL PYME (Chile):
- Contrato por escrito obligatorio para todos los trabajadores.
- AFP: el trabajador elige, el empleador informa.
- Sistema de salud: FONASA o ISAPRE.
- Seguro de cesantía: obligatorio.
- Previred: declaración mensual de remuneraciones y cotizaciones.
- Dirección del Trabajo: fiscaliza cumplimiento.
`;

export class LaborKnowledgeClient {
  async query(_query: KnowledgeQuery): Promise<KnowledgeResponse> {
    return {
      content: LABOR_GUIDE,
      sources: ["Dirección del Trabajo", "Previred", "Superintendencia de Pensiones"],
    };
  }
}
