import { z } from "zod";
import {
  LaunchAgentResult,
  lifecycleStageSchema,
  RoadmapItemStatus,
} from "@/lib/schemas";

export function buildDefaultRoadmapItems(): LaunchAgentResult["roadmap_items"] {
  return [
    {
      stage: "exploration",
      title: "Diagnóstico inicial del negocio",
      description: "Evaluar idea, rubro y necesidades básicas.",
      status: "pending",
      sort_order: 0,
      due_date: undefined,
      source_name: "Guía operativa Copiloto Pyme",
      source_url: undefined,
    },
    {
      stage: "exploration",
      title: "Análisis de mercado local",
      description: "Conocer competencia y demanda en la comuna.",
      status: "pending",
      sort_order: 1,
      due_date: undefined,
      source_name: "Guía operativa Copiloto Pyme",
      source_url: undefined,
    },
    {
      stage: "constitution",
      title: "Elegir figura legal",
      description: "Comparar Empresario Individual, EIRL y SpA según socios y riesgo.",
      status: "pending",
      sort_order: 2,
      due_date: undefined,
      source_name: "Guía operativa Copiloto Pyme",
      source_url: undefined,
    },
    {
      stage: "constitution",
      title: "Inscribir empresa en Registro Comercial",
      description: "Constituir la empresa a través de Empresa en un Día.",
      status: "pending",
      sort_order: 3,
      due_date: undefined,
      source_name: "Guía operativa Copiloto Pyme",
      source_url: undefined,
    },
    {
      stage: "constitution",
      title: "Obtener patente municipal",
      description: "Solicitar patente comercial en la municipalidad correspondiente.",
      status: "pending",
      sort_order: 4,
      due_date: undefined,
      source_name: "Guía operativa Copiloto Pyme",
      source_url: undefined,
    },
    {
      stage: "tax_start",
      title: "Obtener RUT de la empresa",
      description: "Inscripción en el SII para obtener RUT tributario.",
      status: "pending",
      sort_order: 5,
      due_date: undefined,
      source_name: "Guía operativa Copiloto Pyme",
      source_url: undefined,
    },
    {
      stage: "tax_start",
      title: "Iniciar actividades en el SII",
      description: "Declarar inicio de actividades y giro tributario.",
      status: "pending",
      sort_order: 6,
      due_date: undefined,
      source_name: "Guía operativa Copiloto Pyme",
      source_url: undefined,
    },
    {
      stage: "tax_start",
      title: "Solicitar timbraje de boletas y facturas",
      description: "Habilitar folios electrónicos en el SII.",
      status: "pending",
      sort_order: 7,
      due_date: undefined,
      source_name: "Guía operativa Copiloto Pyme",
      source_url: undefined,
    },
    {
      stage: "operation",
      title: "Configurar libro de caja",
      description: "Definir categorías de ingresos y egresos.",
      status: "pending",
      sort_order: 8,
      due_date: undefined,
      source_name: "Guía operativa Copiloto Pyme",
      source_url: undefined,
    },
    {
      stage: "operation",
      title: "Registrar primera venta",
      description: "Ingresar la primera transacción de venta en el sistema.",
      status: "pending",
      sort_order: 9,
      due_date: undefined,
      source_name: "Guía operativa Copiloto Pyme",
      source_url: undefined,
    },
  ];
}

export function safeParseRoadmapItems(
  raw: unknown
): { items: LaunchAgentResult["roadmap_items"]; warnings: string[] } {
  const warnings: string[] = [];

  if (!Array.isArray(raw)) {
    warnings.push("Claude no entregó tareas de hoja de ruta; se usó una hoja de ruta determinística.");
    return { items: buildDefaultRoadmapItems(), warnings };
  }

  const valid: LaunchAgentResult["roadmap_items"] = raw.filter((item): item is Record<string, unknown> => {
    if (!item || typeof item !== "object") return false;
    const title = item.title;
    const description = item.description;
    const stage = item.stage;
    return (
      typeof title === "string" && title.trim().length > 0 &&
      typeof description === "string" && description.trim().length > 0 &&
      typeof stage === "string" && stage.trim().length > 0
    );
  }).map((item, idx) => ({
    stage: item.stage as z.infer<typeof lifecycleStageSchema>,
    title: String(item.title).trim(),
    description: String(item.description).trim(),
    status: (item.status as RoadmapItemStatus) || "pending",
    due_date: item.due_date ? String(item.due_date) : undefined,
    source_name: item.source_name ? String(item.source_name) : undefined,
    source_url: item.source_url ? String(item.source_url) : undefined,
    sort_order: typeof item.sort_order === "number" ? item.sort_order : idx,
  }));

  if (valid.length === 0) {
    warnings.push("Claude no entregó tareas de hoja de ruta; se usó una hoja de ruta determinística.");
    return { items: buildDefaultRoadmapItems(), warnings };
  }

  if (valid.length < 5) {
    warnings.push(
      `Claude entregó solo ${valid.length} tarea(s) de hoja de ruta; se completó con tareas determinísticas hasta alcanzar 10.`
    );
  }

  if (valid.length >= 5) {
    return { items: valid, warnings };
  }

  // Completar con defaults no duplicados hasta 10
  const defaults = buildDefaultRoadmapItems();
  const existingTitles = new Set(valid.map((v) => v.title.toLowerCase()));
  const combined = [...valid];

  for (const def of defaults) {
    if (combined.length >= 10) break;
    if (!existingTitles.has(def.title.toLowerCase())) {
      combined.push(def);
      existingTitles.add(def.title.toLowerCase());
    }
  }

  // Si aún no llegamos a 5 (caso extremo), agregar defaults aunque dupliquen
  for (const def of defaults) {
    if (combined.length >= 5) break;
    combined.push(def);
  }

  return { items: combined, warnings };
}
