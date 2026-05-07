import {
  KnowledgeClient,
  KnowledgeQuery,
  KnowledgeQueryContext,
  KnowledgeResponse,
} from "../../types";

const CASHBOOK_GUIDE = `
LIBRO DE CAJA (Chile):
- Es el registro diario de todos los ingresos y egresos del negocio.
- Debe llevarse desde el primer dia de operaciones.
- Cada transaccion debe incluir: monto, categoria, fecha, descripcion.
- Categorias comunes: Ventas, Arriendo, Servicios, Materias primas, Equipamiento.
- No es lo mismo que una factura o boleta: el libro de caja refleja el movimiento real de dinero.
- Para registrar un egreso usa frases como "pague arriendo por 500000" y el sistema detectara la accion.
`;

const BALANCE_GUIDE = `
SALDO Y BALANCE (Chile):
- El saldo actual es ingresos totales menos egresos totales.
- Puedes consultar "cuanto he gastado este mes" o "cuales son mis ultimos egresos".
- Los ingresos incluyen ventas, cobros y transferencias recibidas.
- Los egresos incluyen compras de materias primas, arriendo, servicios, equipamiento.
- El sistema muestra el saldo acumulado historico, no solo del mes actual.
`;

const EXPENSES_GUIDE = `
EGRESOS Y GASTOS (Chile):
- Egreso: salida de dinero de tu caja o cuenta.
- Categorias comunes de egreso: Arriendo, Materias primas, Servicios, Equipamiento, Sueldos.
- Diferencia clave: un documento tributario (factura de compra) no es un egreso hasta que efectivamente pagas.
- Para registrar un egreso, necesitas: monto, categoria, fecha y descripcion.
- Ejemplo de como escribir para registrar: "compre harina por 45000".
`;

const INCOME_GUIDE = `
INGRESOS Y VENTAS (Chile):
- Ingreso: entrada de dinero a tu caja o cuenta.
- Categorias comunes de ingreso: Ventas, Servicios prestados, Devoluciones.
- Diferencia clave: emitir una boleta o factura no es un ingreso hasta que recibes el pago.
- Para registrar un ingreso, necesitas: monto, categoria, fecha y descripcion.
- Ejemplo de como escribir para registrar: "vendi pan por 185000".
`;

const INVOICE_GUIDE = `
FACTURAS VS PAGOS (Chile):
- Una factura emitida no significa que hayas recibido el dinero.
- Una factura de compra recibida no significa que hayas pagado.
- El libro de caja registra el movimiento real de dinero, no el documento.
- Para saber si una factura esta pagada, revisa si aparece un egreso con el mismo monto y proveedor.
- Las boletas electronicas son obligatorias y deben emitirse al momento de la venta.
`;

const CATEGORIZATION_GUIDE = `
CATEGORIAS DE TRANSACCIONES (Chile):
- Ventas: dinero recibido por venta de productos o servicios.
- Arriendo: pago mensual por local comercial, oficina o bodega.
- Servicios: luz, agua, internet, telefono, gas.
- Materias primas: harina, levadura, azucar, ingredientes, insumos de produccion.
- Equipamiento: horno, maquinaria, herramientas, computadores.
- Sueldos: pagos a trabajadores (si aplica).
- Otro: cualquier gasto o ingreso que no encaje en las categorias anteriores.
`;

const MISSING_AMOUNT_GUIDE = `
DATOS FALTANTES PARA REGISTRAR (Chile):
- Si el usuario quiere registrar una transaccion pero falta algun dato, pide amablemente:
  - monto (obligatorio)
  - categoria (obligatorio)
  - descripcion (obligatorio)
  - fecha (obligatorio, si no se indica se asume hoy)
- Sugiere un formato facil: "pague harina por 45000 el 5 de mayo".
- No registres la transaccion si faltan datos. Solo explica que falta.
- Si el usuario da informacion incompleta, indicale que campos faltan especificamente.
`;

const DISCLAIMER = `
RECUERDA: No calcules IVA ni impuestos. No des asesoria tributaria definitiva.
No inventes montos, fechas ni transacciones que el usuario no haya mencionado.
`;

function selectKnowledge(query: KnowledgeQuery): string {
  const topic = (query.topic || "").toLowerCase();
  const parts: string[] = [];

  if (topic.includes("cashbook") || topic.includes("libro")) {
    parts.push(CASHBOOK_GUIDE);
  }
  if (topic.includes("balance") || topic.includes("saldo")) {
    parts.push(BALANCE_GUIDE);
  }
  if (topic.includes("expense") || topic.includes("egreso") || topic.includes("gasto")) {
    parts.push(EXPENSES_GUIDE);
  }
  if (topic.includes("income") || topic.includes("ingreso") || topic.includes("venta")) {
    parts.push(INCOME_GUIDE);
  }
  if (topic.includes("invoice") || topic.includes("factura") || topic.includes("pago")) {
    parts.push(INVOICE_GUIDE);
  }
  if (topic.includes("categor")) {
    parts.push(CATEGORIZATION_GUIDE);
  }
  if (topic.includes("missing")) {
    parts.push(MISSING_AMOUNT_GUIDE);
  }

  if (parts.length === 0) {
    parts.push(CASHBOOK_GUIDE, BALANCE_GUIDE, CATEGORIZATION_GUIDE);
  }

  parts.push(DISCLAIMER);
  return parts.join("\n---\n");
}

function buildContextualNotes(context?: KnowledgeQueryContext): string {
  if (!context) return "";

  const notes: string[] = [];

  if (context.stage) {
    const stageNotes: Record<string, string> = {
      exploration: "El negocio esta en etapa de exploracion. Probablemente no tiene transacciones de caja aun.",
      operation: "El negocio esta en operacion. Debe tener transacciones de caja activas.",
      hiring: "El negocio esta contratando. Los sueldos seran egresos recurrentes.",
    };
    const note = stageNotes[context.stage] || `Etapa actual: ${context.stage}.`;
    notes.push(note);
  }

  if (context.industry) {
    notes.push(`Rubro: ${context.industry}.`);
  }

  return notes.length > 0 ? `\nCONTEXTO DE LA EMPRESA:\n${notes.join("\n")}` : "";
}

export class OperationsKnowledgeClient implements KnowledgeClient {
  async query(query: KnowledgeQuery): Promise<KnowledgeResponse> {
    const content = selectKnowledge(query) + buildContextualNotes(query.context);
    return {
      content,
      sources: ["SII Chile", "Copiloto Pyme"],
    };
  }
}
