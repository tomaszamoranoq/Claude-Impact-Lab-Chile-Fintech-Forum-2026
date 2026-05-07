import { KnowledgeQuery, KnowledgeResponse, KnowledgeQueryContext } from "../../types";

const BUSINESS_FORMATION_GUIDE = `
EMPRESA EN UN DÍA (Chile):
- Permite constituir SpA, EIRL o Empresario Individual en 1 día hábil.
- Requisitos: RUT de socios, capital inicial mínimo ($0 para SpA), domicilio social, nombre de fantasía.
- SpA: patrimonio separado, múltiples socios, gestión flexible.
- EIRL: patrimonio separado, un solo titular.
- Empresario Individual: rápido, barato, responsabilidad ilimitada.

REGLA CRÍTICA: Si hay socios, SpA es la única opción viable.
`;

const TAX_OBLIGATIONS_GUIDE = `
OBLIGACIONES TRIBUTARIAS PROPYME (Chile):
- Régimen PROPYME General con Contabilidad Simplificada.
- IVA mensual: Formulario F29, dentro de los 12 días hábiles del mes siguiente.
- Renta anual: Formulario F22, abril de cada año.
- Boletas electrónicas: obligatorias desde el inicio de actividades.
- Timbraje: solicitar códigos de autorización en SII.
- Retenciones: F30 si se pagan honorarios a terceros.
`;

const MUNICIPAL_GUIDE = `
TRÁMITES MUNICIPALES (Chile):
- Patente comercial: obligatoria para operar con local físico.
- Certificado de uso de suelo: verificar que el local permita el rubro.
- Rubros alimenticios: posible fiscalización de Seremi de Salud.
- Plazo estimado: 5 a 10 días hábiles.
`;

const LABOR_GUIDE = `
OBLIGACIONES LABORALES (Chile):
- Contrato por escrito obligatorio.
- Inscripción en AFP, sistema de salud, seguro de cesantía.
- Declaración mensual en Previred.
- Dirección del Trabajo: fiscaliza cumplimiento.
`;

function selectKnowledge(query: KnowledgeQuery): string {
  const topics = query.topic.toLowerCase();
  const parts: string[] = [];

  if (topics.includes("formation") || topics.includes("constitution")) {
    parts.push(BUSINESS_FORMATION_GUIDE);
  }

  if (topics.includes("tax") || topics.includes("tributar")) {
    parts.push(TAX_OBLIGATIONS_GUIDE);
  }

  if (topics.includes("municipal") || topics.includes("patente")) {
    parts.push(MUNICIPAL_GUIDE);
  }

  if (topics.includes("labor") || topics.includes("contrat")) {
    parts.push(LABOR_GUIDE);
  }

  if (parts.length === 0) {
    parts.push(BUSINESS_FORMATION_GUIDE, TAX_OBLIGATIONS_GUIDE);
  }

  return parts.join("\n---\n");
}

function buildContextualNotes(context?: KnowledgeQueryContext): string {
  if (!context) return "";

  const notes: string[] = [];

  if (context.hasPartners === true) {
    notes.push("El usuario tiene socios. Recomendar SpA obligatoriamente.");
  }

  if (context.stage) {
    notes.push(`Etapa actual del negocio: ${context.stage}.`);
  }

  if (context.industry) {
    notes.push(`Rubro: ${context.industry}.`);
  }

  if (context.plansToHire === true) {
    notes.push("El usuario planea contratar: incluir obligaciones laborales.");
  }

  return notes.length > 0 ? `\nCONTEXTO DEL USUARIO:\n${notes.join("\n")}` : "";
}

export class LaunchKnowledgeClient {
  async query(query: KnowledgeQuery): Promise<KnowledgeResponse> {
    const content = selectKnowledge(query) + buildContextualNotes(query.context);

    return {
      content,
      sources: [
        "SII Chile",
        "Registro de Empresas y Sociedades",
        "Municipalidad de Providencia",
        "Dirección del Trabajo",
        "Previred",
      ],
    };
  }
}
