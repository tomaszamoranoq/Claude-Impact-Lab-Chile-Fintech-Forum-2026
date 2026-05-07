import {
  KnowledgeClient,
  KnowledgeQuery,
  KnowledgeQueryContext,
  KnowledgeResponse,
} from "../../types";

const F29_GUIDE = `
F29 - DECLARACIÓN MENSUAL DE IVA (Chile):
- Es la declaración mensual de Impuesto al Valor Agregado.
- Incluye débito fiscal (IVA de tus ventas) y crédito fiscal (IVA de tus compras).
- Se presenta ante el SII según el calendario mensual definido por el SII.
- Obligatorio para empresas con inicio de actividades vigente que emiten boletas o facturas.
- Si no hay movimiento en el mes, igual debe presentarse (F29 sin movimiento).
- El no presentarlo genera multas e intereses.
- Se presenta en línea en SII.cl con clave tributaria.
`;

const F22_GUIDE = `
F22 - DECLARACIÓN ANUAL DE RENTA (Chile):
- Es la declaración anual de impuesto a la renta.
- Todas las empresas con giro comercial deben presentarla.
- El periodo para presentar es según calendario anual del SII.
- Para el régimen PROPYME General con Contabilidad Simplificada, la base imponible se calcula según los ingresos y egresos del año comercial.
- Requiere llevar registro de ingresos, egresos y compras durante el año.
`;

const IVA_GUIDE = `
IVA - IMPUESTO AL VALOR AGREGADO (Chile):
- Funciona con una tasa general que debes verificar en SII.cl. Esta guía explica el mecanismo, no el cálculo oficial.
- Débito fiscal: IVA que cobras a tus clientes en boletas y facturas.
- Crédito fiscal: IVA que pagas en tus compras relacionadas con el giro.
- La diferencia (débito menos crédito) se paga o se arrastra como remanente.
- Las boletas y facturas deben ser electrónicas desde el inicio de actividades.
- No se calcula IVA sobre compras personales no relacionadas con el giro.
`;

const MUNICIPAL_GUIDE = `
PATENTE MUNICIPAL (Chile):
- Obligatoria para operar con local comercial, oficina o bodega.
- Se solicita en la municipalidad del domicilio comercial.
- El valor depende del capital propio declarado y del rubro.
- Se renueva anualmente (semestre según municipio).
- Requiere: inicio de actividades en SII, contrato de arriendo o título de dominio, certificado de uso de suelo compatible con el rubro.
- Rubros alimenticios pueden requerir autorización sanitaria adicional (Seremi de Salud).
- Verifica requisitos y plazos exactos en tu municipalidad.
`;

const PREVIRED_GUIDE = `
PREVIRED - COTIZACIONES PREVISIONALES (Chile):
- Aplica SOLO si tienes trabajadores dependientes contratados.
- Se declara y paga mensualmente a través de Previred.
- Incluye: cotización de AFP, salud (FONASA o ISAPRE), seguro de cesantía.
- El plazo de pago está definido por Previred según el RUT del empleador.
- También se declaran las remuneraciones del mes (sueldo bruto, líquido, descuentos).
- Si no tienes trabajadores, no aplica. Si contratas en el futuro, será obligatorio desde el primer mes.
- Si pagas honorarios a terceros con retención, se informa en el mismo sistema.
`;

const TAX_START_GUIDE = `
INICIO DE ACTIVIDADES EN SII (Chile):
- Es el trámite que formaliza tu empresa ante el Servicio de Impuestos Internos.
- Define tu giro tributario (la actividad económica que realizarás).
- Se hace una sola vez al comenzar, mediante el Formulario 4415 en SII.cl.
- Requiere: RUT de la empresa, domicilio comercial, representante legal.
- Después del inicio de actividades:
  - Solicitar timbraje de boletas y facturas electrónicas.
  - Elegir régimen tributario (ej. PROPYME General con Contabilidad Simplificada).
  - Comenzar a registrar ingresos y egresos desde el primer día.
- Sin inicio de actividades no puedes emitir boletas ni facturas legales.
`;

const DISCLAIMER = `
ADVERTENCIA: Las fechas y requisitos exactos deben verificarse en los portales oficiales
(SII Chile, Municipalidad correspondiente, Previred, Dirección del Trabajo).
Esta guía es educativa y no constituye asesoría legal o tributaria definitiva.
No des fechas exactas de vencimiento, usa frases como "según calendario del SII"
o "verifica en tu municipalidad".
`;

function selectKnowledge(query: KnowledgeQuery): string {
  const topic = (query.topic || "").toLowerCase();
  const parts: string[] = [];

  if (topic.includes("f29") || topic.includes("iva mensual")) {
    parts.push(F29_GUIDE);
  }
  if (topic.includes("f22") || topic.includes("renta anual") || topic.includes("renta")) {
    parts.push(F22_GUIDE);
  }
  if (topic.includes("iva") && !topic.includes("iva mensual")) {
    parts.push(IVA_GUIDE);
  }
  if (topic.includes("patente") || topic.includes("municipal")) {
    parts.push(MUNICIPAL_GUIDE);
  }
  if (topic.includes("previred") || topic.includes("cotizacion") || topic.includes("afp") || topic.includes("trabajador")) {
    parts.push(PREVIRED_GUIDE);
  }
  if (topic.includes("inicio") || topic.includes("tax_start") || topic.includes("sii")) {
    parts.push(TAX_START_GUIDE);
  }

  if (parts.length === 0) {
    parts.push(F29_GUIDE, F22_GUIDE, MUNICIPAL_GUIDE, PREVIRED_GUIDE, TAX_START_GUIDE);
  }

  parts.push(DISCLAIMER);
  return parts.join("\n---\n");
}

function buildContextualNotes(context?: KnowledgeQueryContext): string {
  if (!context) return "";

  const notes: string[] = [];

  if (context.stage) {
    const stageNotes: Record<string, string> = {
      exploration: "El negocio está en etapa de exploración. Probablemente no tiene inicio de actividades ni obligaciones aún.",
      constitution: "El negocio está en etapa de constitución. El inicio de actividades en SII es el próximo paso clave.",
      tax_start: "El negocio está iniciando obligaciones tributarias. El F29 y timbraje son prioritarios.",
      operation: "El negocio está en operación. Debe tener al día F29, patente y registro de ingresos/egresos.",
      hiring: "El negocio está contratando o tiene trabajadores. Previred y obligaciones laborales aplican.",
    };
    const note = stageNotes[context.stage] || `Etapa actual: ${context.stage}.`;
    notes.push(note);
  }

  if (context.municipality) {
    notes.push(`Municipio: ${context.municipality}. La patente municipal depende de esta comuna.`);
  }

  if (context.plansToHire === true) {
    notes.push("El usuario planea contratar trabajadores. Previred será obligatorio.");
  }

  if (context.plansToHire === false) {
    notes.push("El usuario NO planea contratar trabajadores. Previred no aplica por ahora.");
  }

  if (context.industry) {
    notes.push(`Rubro: ${context.industry}.`);
  }

  return notes.length > 0 ? `\nCONTEXTO DE LA EMPRESA:\n${notes.join("\n")}` : "";
}

export class ComplianceKnowledgeClient implements KnowledgeClient {
  async query(query: KnowledgeQuery): Promise<KnowledgeResponse> {
    const content = selectKnowledge(query) + buildContextualNotes(query.context);
    return {
      content,
      sources: [
        "SII Chile",
        "Previred",
        "Municipalidad correspondiente",
        "Dirección del Trabajo",
        "Copiloto Pyme",
      ],
    };
  }
}
