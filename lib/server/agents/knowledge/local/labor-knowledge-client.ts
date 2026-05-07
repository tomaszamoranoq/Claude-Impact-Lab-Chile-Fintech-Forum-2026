import {
  KnowledgeClient,
  KnowledgeQuery,
  KnowledgeQueryContext,
  KnowledgeResponse,
} from "../../types";

const HIRING_GUIDE = `
CONTRATACION DE TRABAJADORES (Chile):
Datos del trabajador necesarios:
- Nombre completo
- RUT
- Fecha de nacimiento
- Domicilio
- Nacionalidad
Datos que debe definir el empleador:
- Tipo de contrato (plazo fijo, indefinido, por obra o faena)
- Fecha de inicio de labores
- Cargo o funcion que desempenara
- Jornada laboral (dentro de los limites legales vigentes)
- Sueldo bruto pactado
- Lugar de trabajo
Datos que el trabajador debe informar:
- AFP elegida
- Sistema de salud (FONASA o ISAPRE)
Datos de la empresa:
- RUT de la empresa
- Nombre o razon social
- Direccion comercial
`;

const CONTRACT_GUIDE = `
CONTRATO DE TRABAJO (Chile):
- Debe ser por escrito y firmado por ambas partes.
- Debe contener: identificacion de las partes, fecha de inicio, cargo, sueldo, jornada, lugar de trabajo, tipo de contrato, duracion si es plazo fijo.
- Tipos de contrato:
  - Plazo fijo: tiene fecha de termino definida.
  - Indefinido: no tiene fecha de termino, dura mientras las partes lo mantengan.
  - Por obra o faena: dura lo que dure la obra especifica.
- El contrato debe entregarse al trabajador dentro de los plazos definidos por la Direccion del Trabajo.
- Verifica los requisitos actualizados en la Direccion del Trabajo.
`;

const SALARY_GUIDE = `
SUELDOS Y REMUNERACIONES (Chile):
- Sueldo bruto: monto acordado antes de descuentos.
- Descuentos legales obligatorios: cotizacion previsional, salud y seguro de cesantia.
- Sueldo liquido: lo que recibe el trabajador despues de los descuentos.
- NO calcules sueldo liquido exacto. Los porcentajes de descuento dependen de AFP, sistema de salud, tramo de renta y otras condiciones.
- Si el usuario pide un calculo exacto, explicale los conceptos y recomienda consultar con un contador o usar calculadoras oficiales de Previred.
- Ingreso minimo mensual: verificar valor vigente en la Direccion del Trabajo.
`;

const PAYROLL_GUIDE = `
LIQUIDACION DE SUELDO (Chile):
- Es el documento mensual que detalla todos los conceptos del sueldo.
- Debe incluir: sueldo bruto, descuentos legales (AFP, salud, cesantia), otros descuentos, sueldo liquido, firma del trabajador.
- Se entrega mensualmente al trabajador.
- Formato y contenidos minimos estan definidos por la Direccion del Trabajo.
- NO calcules liquidaciones exactas. Explica los conceptos.
`;

const PREVIRED_GUIDE = `
PREVIRED Y COTIZACIONES (Chile):
- Previred es el sistema de declaracion y pago de cotizaciones previsionales.
- Aplica SOLO si tienes trabajadores dependientes contratados.
- Incluye: cotizacion de AFP, salud (FONASA o ISAPRE), seguro de cesantia.
- La declaracion es mensual, segun el calendario de Previred.
- NO des fechas exactas de pago ni porcentajes de cotizacion sin advertir que deben verificarse en Previred.
- Si no tienes trabajadores, Previred no aplica.
- Al contratar por primera vez, debes inscribirte como empleador en Previred.
`;

const WORKING_HOURS_GUIDE = `
JORNADA LABORAL (Chile):
- La jornada debe respetar los limites legales vigentes segun la Direccion del Trabajo.
- Existen jornadas ordinarias, parciales y extraordinarias.
- Las horas extraordinarias deben pactarse y pagarse con recargo.
- Los limites de jornada y descanso estan regulados por el Codigo del Trabajo.
- NO afirmes un numero especifico de horas semanales. Indica que debe verificarse la normativa vigente en la Direccion del Trabajo.
- Para jornadas especiales (transporte, casa particular, etc.) existen regulaciones especificas.
`;

const HONORARIOS_VS_EMPLOYEE_GUIDE = `
HONORARIOS VS TRABAJADOR DEPENDIENTE (Chile):
- Trabajador dependiente: tiene contrato de trabajo, recibe sueldo, el empleador paga cotizaciones.
- Honorarios: la persona emite boleta de honorarios, no hay relacion laboral, no hay cotizaciones pagadas por quien contrata.
- Diferencia clave: si hay subordinacion, dependencia, horario fijo y jefatura directa, podria existir una relacion laboral aunque se emitan boletas de honorarios.
- NO recomiendes usar honorarios como sustituto de contrato laboral.
- Sugiere verificar con la Direccion del Trabajo si hay dudas sobre la naturaleza del vinculo.
- Los honorarios generan retencion de impuestos que la persona que emite la boleta debe pagar.
`;

const DISCLAIMER = `
ADVERTENCIA:
- No des asesoria legal definitiva.
- No calcules sueldos liquidos, cotizaciones ni porcentajes exactos.
- No des fechas exactas de pago de cotizaciones ni plazos legales fijos.
- Recomienda siempre verificar en Direccion del Trabajo, Previred y con un contador.
`;

function selectKnowledge(query: KnowledgeQuery): string {
  const topic = (query.topic || "").toLowerCase();
  const parts: string[] = [];

  if (topic.includes("hiring") || topic.includes("contratar") || topic.includes("necesito para contratar")) {
    parts.push(HIRING_GUIDE);
  }
  if (topic.includes("contract") || topic.includes("contrato") || topic.includes("plazo fijo") || topic.includes("indefinido")) {
    parts.push(CONTRACT_GUIDE);
  }
  if (topic.includes("salary") || topic.includes("sueldo") || topic.includes("salario") || topic.includes("liquido") || topic.includes("bruto")) {
    parts.push(SALARY_GUIDE);
  }
  if (topic.includes("payroll") || topic.includes("liquidacion")) {
    parts.push(PAYROLL_GUIDE);
  }
  if (topic.includes("previred") || topic.includes("cotizacion") || topic.includes("imposicion") || topic.includes("afp") || topic.includes("fonasa") || topic.includes("isapre")) {
    parts.push(PREVIRED_GUIDE);
  }
  if (topic.includes("working") || topic.includes("jornada") || topic.includes("hora")) {
    parts.push(WORKING_HOURS_GUIDE);
  }
  if (topic.includes("honorario") || topic.includes("dependiente") || topic.includes("boleta")) {
    parts.push(HONORARIOS_VS_EMPLOYEE_GUIDE);
  }

  if (parts.length === 0) {
    parts.push(HIRING_GUIDE, CONTRACT_GUIDE, PREVIRED_GUIDE, HONORARIOS_VS_EMPLOYEE_GUIDE);
  }

  parts.push(DISCLAIMER);
  return parts.join("\n---\n");
}

function buildContextualNotes(context?: KnowledgeQueryContext): string {
  if (!context) return "";

  const notes: string[] = [];

  if (context.stage) {
    const stageNotes: Record<string, string> = {
      exploration: "El negocio esta en etapa de exploracion. La contratacion no es inmediata.",
      operation: "El negocio esta en operacion. Si necesita contratar, Previred sera obligatorio.",
      hiring: "El negocio esta en etapa de contratacion. Previred y obligaciones laborales aplican.",
    };
    const note = stageNotes[context.stage] || `Etapa actual: ${context.stage}.`;
    notes.push(note);
  }

  if (context.plansToHire === true) {
    notes.push("El usuario planea contratar trabajadores. Previred sera obligatorio.");
  }

  if (context.plansToHire === false) {
    notes.push("El usuario NO planea contratar trabajadores. Previred no aplica por ahora.");
  }

  if (context.industry) {
    notes.push(`Rubro: ${context.industry}.`);
  }

  return notes.length > 0 ? `\nCONTEXTO DE LA EMPRESA:\n${notes.join("\n")}` : "";
}

export class LaborKnowledgeClient implements KnowledgeClient {
  async query(query: KnowledgeQuery): Promise<KnowledgeResponse> {
    const content = selectKnowledge(query) + buildContextualNotes(query.context);
    return {
      content,
      sources: [
        "Direccion del Trabajo",
        "Previred",
        "Copiloto Pyme",
      ],
    };
  }
}
