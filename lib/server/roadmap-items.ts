import { supabase } from "@/lib/server/supabase";
import {
  RoadmapItem,
  LaunchAgentRoadmapItem,
} from "@/lib/schemas";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createRoadmapItems(
  items: LaunchAgentRoadmapItem[],
  companyId: string,
  diagnosisId?: string
): Promise<RoadmapItem[]> {
  const inputs = items.map((item, idx) => ({
    id: generateId("roadmap"),
    company_id: companyId,
    source_diagnosis_id: diagnosisId || null,
    stage: item.stage,
    title: item.title,
    description: item.description,
    status: item.status,
    due_date: item.due_date || null,
    source_name: item.source_name || null,
    source_url: item.source_url || null,
    sort_order: item.sort_order ?? idx,
  }));

  const { data, error } = await supabase
    .from("roadmap_items")
    .insert(inputs)
    .select();

  if (error) {
    throw new Error(`Error creando roadmap items: ${error.message}`);
  }

  return (data ?? []) as unknown as RoadmapItem[];
}

export async function listRoadmapItems(companyId: string): Promise<RoadmapItem[]> {
  const { data, error } = await supabase
    .from("roadmap_items")
    .select("*")
    .eq("company_id", companyId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Error listando roadmap items: ${error.message}`);
  }

  return (data ?? []) as unknown as RoadmapItem[];
}

export async function deleteRoadmapItemsByDiagnosis(diagnosisId: string): Promise<void> {
  const { error } = await supabase
    .from("roadmap_items")
    .delete()
    .eq("source_diagnosis_id", diagnosisId);

  if (error) {
    throw new Error(`Error eliminando roadmap items: ${error.message}`);
  }
}

export async function getLatestRoadmapItemsByDiagnosis(
  companyId: string
): Promise<RoadmapItem[]> {
  // 1. Encontrar el último source_diagnosis_id que realmente tiene roadmap_items
  const { data: latestLink, error: linkError } = await supabase
    .from("roadmap_items")
    .select("source_diagnosis_id")
    .eq("company_id", companyId)
    .not("source_diagnosis_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (linkError) {
    if (linkError.code === "PGRST116") return [];
    throw new Error(`Error obteniendo último roadmap: ${linkError.message}`);
  }

  if (!latestLink?.source_diagnosis_id) {
    return [];
  }

  // 2. Traer todos los items de ese diagnóstico
  const { data, error } = await supabase
    .from("roadmap_items")
    .select("*")
    .eq("company_id", companyId)
    .eq("source_diagnosis_id", latestLink.source_diagnosis_id)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Error listando roadmap items: ${error.message}`);
  }

  return (data ?? []) as unknown as RoadmapItem[];
}
