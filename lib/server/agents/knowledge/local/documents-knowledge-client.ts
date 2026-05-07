import {
  KnowledgeClient,
  KnowledgeQuery,
  KnowledgeQueryContext,
  KnowledgeResponse,
} from "../../types";

const UPLOAD_GUIDANCE_GUIDE = `
SUBIR DOCUMENTOS (Chile):
- Tipos aceptados: PDF, PNG, JPG/JPEG.
- Limite actual: 5 MB por archivo.
- Para subir documentos: ve al modulo Documentos en la barra lateral.
- Arrastra el archivo o haz clic para seleccionarlo.
- Elige la carpeta correcta: Legal, Tributario, RRHH u Operaciones.
- Despues de subir, el documento queda en estado "Subido".
- Para extraer datos: pulsa el boton Analizar junto al documento.
`;

const DOCUMENT_TYPES_GUIDE = `
TIPOS DE DOCUMENTOS (Chile):
- Factura: documento tributario de compra o venta. No significa que el dinero ya se haya movido.
- Boleta: documento de venta al consumidor final. Puede representar un ingreso si fue pagada.
- Contrato: documento legal o laboral. No genera movimiento de caja automaticamente.
- Certificado tributario: documento de soporte del SII. Informativo, no genera caja.
- Carpetas disponibles:
  - Legal: escrituras, contratos, poderes, constituciones.
  - Tributario: F29, F22, certificados SII, facturas, boletas.
  - RRHH: contratos laborales, finiquitos, liquidaciones.
  - Operaciones: documentos operativos, contratos de arriendo, facturas de proveedores.
`;

const ANALYSIS_FLOW_GUIDE = `
FLUJO DE ANALISIS (Chile):
1. Subir el documento en el modulo Documentos.
2. El documento queda en estado "Subido".
3. Pulsar el boton Analizar.
4. El sistema ejecuta un analisis simulado que genera datos de prueba.
5. Revisar los datos extraidos en la pantalla de extraccion.
6. Si los datos son correctos, pulsar Confirmar extraccion.
7. El sistema crea una accion propuesta en Acciones IA.
8. Ve a Acciones IA y confirma la accion para que el movimiento aparezca en tu libro de caja.
Este flujo completo te permite practicar todo el proceso aunque el analisis sea simulado.
`;

const INVOICE_VS_PAYMENT_GUIDE = `
FACTURAS VS PAGOS (Chile):
- Una factura emitida NO significa que hayas recibido el dinero.
- Una factura de compra recibida NO significa que hayas pagado.
- La boleta es un documento de venta al consumidor.
- El libro de caja registra el movimiento real de dinero, no el documento.
- Confirmar una extraccion documental crea una propuesta de accion, NO un movimiento automatico.
- El movimiento aparece en caja SOLO despues de confirmar la accion en Acciones IA.
- Diferencia clave: documento ≠ movimiento de caja.
`;

const LIMITATIONS_GUIDE = `
LIMITACIONES ACTUALES:
- El analisis de documentos en esta fase es simulado.
- Los datos extraidos son de prueba, no lectura real del PDF o imagen.
- OCR (lectura real de texto en imagenes) y vision artificial quedan para una fase posterior.
- Mientras tanto, puedes usar el analisis simulado para practicar el flujo completo.
- Los documentos se guardan correctamente en Storage, solo la extraccion de datos es simulada.
- Para dudas especificas sobre el contenido real de un documento, consultalo manualmente.
`;

const DISCLAIMER = `
RECUERDA: No puedes subir archivos desde el chat. Usa el modulo Documentos.
No hagas OCR real ni leas contenido de imagenes. El analisis es simulado.
Solo orientas y explicas el flujo, no ejecutas acciones.
`;

function selectKnowledge(query: KnowledgeQuery): string {
  const topic = (query.topic || "").toLowerCase();
  const parts: string[] = [];

  if (topic.includes("upload") || topic.includes("subir") || topic.includes("cargar")) {
    parts.push(UPLOAD_GUIDANCE_GUIDE);
  }
  if (topic.includes("type") || topic.includes("factura") || topic.includes("boleta") || topic.includes("contrato") || topic.includes("carpeta")) {
    parts.push(DOCUMENT_TYPES_GUIDE);
  }
  if (topic.includes("flow") || topic.includes("analisis") || topic.includes("analizar") || topic.includes("proceso")) {
    parts.push(ANALYSIS_FLOW_GUIDE);
  }
  if (topic.includes("invoice") || topic.includes("pago") || topic.includes("diferencia")) {
    parts.push(INVOICE_VS_PAYMENT_GUIDE);
  }
  if (topic.includes("limit") || topic.includes("ocr") || topic.includes("leer")) {
    parts.push(LIMITATIONS_GUIDE);
  }
  if (topic.includes("status") || topic.includes("cargados") || topic.includes("tengo")) {
    parts.push(DOCUMENT_TYPES_GUIDE);
  }

  if (parts.length === 0) {
    parts.push(UPLOAD_GUIDANCE_GUIDE, DOCUMENT_TYPES_GUIDE, ANALYSIS_FLOW_GUIDE, LIMITATIONS_GUIDE);
  }

  parts.push(DISCLAIMER);
  return parts.join("\n---\n");
}

function buildContextualNotes(context?: KnowledgeQueryContext): string {
  if (!context) return "";

  const notes: string[] = [];

  if (context.stage) {
    const stageNotes: Record<string, string> = {
      exploration: "El negocio esta en etapa de exploracion. Los documentos legales y tributarios aun no son obligatorios.",
      constitution: "El negocio esta en etapa de constitucion. Documentos como escritura de constitucion y RUT seran importantes.",
      tax_start: "El negocio esta iniciando actividades tributarias. Facturas, boletas y certificados SII seran relevantes.",
      operation: "El negocio esta en operacion. Debes mantener organizados facturas, boletas y documentos tributarios.",
    };
    const note = stageNotes[context.stage] || `Etapa actual: ${context.stage}.`;
    notes.push(note);
  }

  if (context.industry) {
    notes.push(`Rubro: ${context.industry}.`);
  }

  return notes.length > 0 ? `\nCONTEXTO DE LA EMPRESA:\n${notes.join("\n")}` : "";
}

export class DocumentsKnowledgeClient implements KnowledgeClient {
  async query(query: KnowledgeQuery): Promise<KnowledgeResponse> {
    const content = selectKnowledge(query) + buildContextualNotes(query.context);
    return {
      content,
      sources: ["SII Chile", "Direccion del Trabajo", "Copiloto Pyme"],
    };
  }
}
