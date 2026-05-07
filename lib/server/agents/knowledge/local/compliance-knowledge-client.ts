import { KnowledgeQuery, KnowledgeResponse } from "../../types";

const COMPLIANCE_GUIDE = `
CUMPLIMIENTO TRIBUTARIO PYME (Chile):
- F29: declaración mensual de IVA, dentro de los 12 días hábiles del mes siguiente.
- F22: declaración anual de renta, abril de cada año.
- Patente municipal: renovación anual.
- Boletas electrónicas: timbraje y folios.
- Calendario de vencimientos: crítico para evitar multas.
`;

export class ComplianceKnowledgeClient {
  async query(_query: KnowledgeQuery): Promise<KnowledgeResponse> {
    return {
      content: COMPLIANCE_GUIDE,
      sources: ["SII Chile", "Municipalidades"],
    };
  }
}
