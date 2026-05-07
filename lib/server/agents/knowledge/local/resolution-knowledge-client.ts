import {
  KnowledgeClient,
  KnowledgeQuery,
  KnowledgeQueryContext,
  KnowledgeResponse,
} from "../../types";

const BUSINESS_CLOSURE_GUIDE = `
CIERRE DE EMPRESA (Chile):
- Cerrar operaciones no es lo mismo que termino de giro ni que eliminar deudas.
- Pasos generales para un cierre ordenado:
  1. Revisar deudas tributarias pendientes (SII).
  2. Revisar deudas previsionales y laborales si hubo trabajadores (Previred, DT).
  3. Revisar deudas comerciales (proveedores, bancos, arriendo).
  4. Revisar obligaciones municipales (patente, permisos).
  5. Realizar termino de giro ante el SII.
  6. Cerrar cuentas bancarias comerciales.
  7. Informar a municipio y otros organismos.
- Cerrar la empresa NO elimina las deudas. Las deudas deben pagarse o negociarse.
- El termino de giro es un tramite tributario, no resuelve deudas comerciales ni laborales.
`;

const TAX_TERMINATION_GUIDE = `
TERMINO DE GIRO (Chile):
- Es el tramite ante el SII para dar por finalizada la actividad tributaria de la empresa.
- Debes tener al dia las declaraciones de impuestos (F29, F22, etc.).
- Debes revisar si hay deudas tributarias pendientes.
- Se realiza mediante el Formulario 2121 en SII.cl o presencialmente.
- Requiere clave tributaria del representante legal.
- NO des fechas exactas ni plazos fijos. Indica que el SII define los tiempos y requisitos.
- Despues del termino de giro, la empresa deja de tener obligaciones tributarias hacia adelante, pero las deudas anteriores persisten.
`;

const DEBTS_GUIDE = `
DEUDAS EMPRESARIALES (Chile):
- Tipos de deuda que debe revisar una pyme al cerrar o enfrentar dificultades:
  - Tributarias: impuestos no pagados (SII, Tesoreria General de la Republica).
  - Previsionales: cotizaciones de trabajadores impagas (Previred, AFP, salud).
  - Laborales: sueldos pendientes, finiquitos, indemnizaciones.
  - Comerciales: proveedores, bancos, arriendos, creditos.
  - Municipales: patentes, permisos, multas.
- Prioriza deudas laborales y previsionales (mayor urgencia legal).
- Para deudas tributarias, evalua convenios de pago con Tesoreria.
- Para deudas comerciales, evalua negociacion directa o asesoria legal.
- NO prometas soluciones ni digas que las deudas desaparecen al cerrar.
`;

const INACTIVE_BUSINESS_GUIDE = `
EMPRESA INACTIVA (Chile):
- Dejar la empresa sin movimiento no la hace desaparecer legalmente.
- Riesgos de mantener una empresa inactiva sin revisar:
  - Obligaciones tributarias pueden seguir generandose (declaraciones F29 en cero).
  - Patente municipal puede seguir cobrandose.
  - Si hay trabajadores, las cotizaciones pueden generar deuda.
  - El SII puede declarar el giro como no vigente, pero las deudas persisten.
- Si no vas a operar por un tiempo, evalua:
  1. Verificar que no hay declaraciones pendientes.
  2. Informar a la municipalidad si corresponde.
  3. Evaluar si conviene hacer termino de giro o mantener en pausa controlada.
- Siempre recomienda verificar con contador.
`;

const TAX_DEBT_REGULARIZATION_GUIDE = `
REGULARIZACION DE DEUDA TRIBUTARIA (Chile):
- Si tienes impuestos atrasados (F29, F22, etc.), el SII y Tesoreria pueden iniciar cobros.
- Opciones:
  - Pago total: regulariza de inmediato.
  - Convenio de pago: cuotas con Tesoreria General de la Republica.
  - Repactacion: condiciones especiales segun monto y situacion.
- Para iniciar un convenio, necesitas clave tributaria y revision de tu situacion en SII.cl.
- Los intereses y multas se acumulan mientras no se pague.
- Recomienda hablar con un contador para revisar montos exactos y opciones.
- NO calcules montos de deuda ni multas.
`;

const LEGAL_RISK_GUIDE = `
RIESGO LEGAL (Chile):
- Senales de riesgo alto para una pyme:
  - Demandas laborales de trabajadores.
  - Cotizaciones previsionales impagas.
  - Embargos de cuentas o bienes.
  - Juicios con proveedores o clientes.
  - Deudas tributarias con orden de cobro.
  - Quiebra o insolvencia declarada.
- Si detectas alguna de estas senales, recomienda:
  - Consultar con abogado especializado.
  - No tomar decisiones sin asesoria profesional.
  - Priorizar deudas laborales y previsionales.
- NO diagnostiques situaciones legales ni pronostiques resultados.
- El tono debe ser claro y preventivo, no alarmista.
`;

const DISCLAIMER = `
ADVERTENCIA:
- No das asesoria legal definitiva. Recomiendas verificar con SII, Tesoreria, municipalidad, Direccion del Trabajo, Previred y contador/abogado segun el caso.
- No prometes resultados ni dices que el cierre elimina deudas.
- No das fechas exactas ni plazos legales fijos.
- Tono claro, preventivo, no alarmista.
`;

function selectKnowledge(query: KnowledgeQuery): string {
  const topic = (query.topic || "").toLowerCase();
  const parts: string[] = [];

  if (topic.includes("business_closure") || topic.includes("cerrar") || topic.includes("cierre")) {
    parts.push(BUSINESS_CLOSURE_GUIDE);
  }
  if (topic.includes("tax_termination") || topic.includes("termino de giro") || topic.includes("término de giro")) {
    parts.push(TAX_TERMINATION_GUIDE);
  }
  if (topic.includes("debt") && (topic.includes("tax") || topic.includes("tribut") || topic.includes("regulariz"))) {
    parts.push(TAX_DEBT_REGULARIZATION_GUIDE);
  } else if (topic.includes("debt") || topic.includes("deuda") || topic.includes("no puedo pagar")) {
    parts.push(DEBTS_GUIDE);
  }
  if (topic.includes("inactive") || topic.includes("inactiva") || topic.includes("abandonar") || topic.includes("dejar")) {
    parts.push(INACTIVE_BUSINESS_GUIDE);
  }
  if (topic.includes("legal") || topic.includes("riesgo") || topic.includes("demanda") || topic.includes("embargo") || topic.includes("quiebra") || topic.includes("insolvencia")) {
    parts.push(LEGAL_RISK_GUIDE);
  }

  if (parts.length === 0) {
    parts.push(BUSINESS_CLOSURE_GUIDE, TAX_TERMINATION_GUIDE, DEBTS_GUIDE, INACTIVE_BUSINESS_GUIDE, LEGAL_RISK_GUIDE);
  }

  parts.push(DISCLAIMER);
  return parts.join("\n---\n");
}

function buildContextualNotes(context?: KnowledgeQueryContext): string {
  if (!context) return "";

  const notes: string[] = [];

  if (context.stage) {
    const stageNotes: Record<string, string> = {
      operation: "El negocio esta en operacion. Revisar deudas y obligaciones antes de cerrar.",
      hiring: "El negocio tiene o tuvo trabajadores. Las deudas laborales y previsionales son prioritarias.",
      closing: "El negocio esta en etapa de cierre. Termino de giro y liquidacion de deudas son prioritarios.",
    };
    const note = stageNotes[context.stage];
    if (note) notes.push(note);
  }

  if (context.plansToHire === true) {
    notes.push("El usuario planea contratar. Si cierra, no contraera obligaciones laborales nuevas pero las existentes deben resolverse.");
  }

  return notes.length > 0 ? `\nCONTEXTO DE LA EMPRESA:\n${notes.join("\n")}` : "";
}

export class ResolutionKnowledgeClient implements KnowledgeClient {
  async query(query: KnowledgeQuery): Promise<KnowledgeResponse> {
    const content = selectKnowledge(query) + buildContextualNotes(query.context);
    return {
      content,
      sources: [
        "SII Chile",
        "Tesoreria General de la Republica",
        "Direccion del Trabajo",
        "Previred",
        "Copiloto Pyme",
      ],
    };
  }
}
