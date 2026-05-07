import { KnowledgeQuery, KnowledgeResponse } from "../../types";

const OPERATIONS_GUIDE = `
OPERACIONES DIARIAS PYME (Chile):
- Libro de caja: registrar ingresos y egresos diarios.
- Categorías comunes: Ventas, Arriendo, Servicios, Materias primas.
- Boletas y facturas electrónicas obligatorias.
- Conciliación bancaria mensual recomendada.
`;

export class OperationsKnowledgeClient {
  async query(_query: KnowledgeQuery): Promise<KnowledgeResponse> {
    return {
      content: OPERATIONS_GUIDE,
      sources: ["SII Chile", "Copiloto Pyme"],
    };
  }
}
