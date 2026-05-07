import {
  BusinessDiagnosis,
  CreateBusinessDiagnosisInput,
} from "@/lib/schemas";
import { supabase } from "./supabase";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createBusinessDiagnosis(
  input: CreateBusinessDiagnosisInput & { company_id: string; user_id: string }
): Promise<BusinessDiagnosis> {
  const diagnosis: BusinessDiagnosis = {
    id: generateId("diag"),
    company_id: input.company_id,
    user_id: input.user_id,
    input_text: input.input_text,
    business_profile: input.business_profile,
    recommended_legal_type: input.recommended_legal_type,
    lifecycle_stage: input.lifecycle_stage,
    assumptions: input.assumptions,
    unknowns: input.unknowns,
    next_steps: input.next_steps,
    confidence: input.confidence,
    model_used: input.model_used,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("business_diagnoses")
    .insert(diagnosis)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create business diagnosis: ${error.message}`);
  }

  return data as BusinessDiagnosis;
}

export async function getLatestBusinessDiagnosis(
  companyId: string
): Promise<BusinessDiagnosis | null> {
  const { data, error } = await supabase
    .from("business_diagnoses")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get latest business diagnosis: ${error.message}`);
  }

  return data as BusinessDiagnosis;
}

export async function getLatestDiagnosisByCompany(
  companyId: string,
  maxAgeHours: number = 24
): Promise<BusinessDiagnosis | null> {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("business_diagnoses")
    .select("*")
    .eq("company_id", companyId)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get latest diagnosis by company: ${error.message}`);
  }

  return data as BusinessDiagnosis;
}

export async function updateBusinessDiagnosis(
  id: string,
  input: Partial<CreateBusinessDiagnosisInput>
): Promise<BusinessDiagnosis> {
  const { data, error } = await supabase
    .from("business_diagnoses")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update business diagnosis: ${error.message}`);
  }

  return data as BusinessDiagnosis;
}

export async function getLatestDiagnosisWithRoadmap(
  companyId: string,
  maxAgeHours: number = 24
): Promise<BusinessDiagnosis | null> {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

  const { data: latestLink, error: linkError } = await supabase
    .from("roadmap_items")
    .select("source_diagnosis_id, created_at")
    .eq("company_id", companyId)
    .not("source_diagnosis_id", "is", null)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (linkError) {
    if (linkError.code === "PGRST116") return null;
    throw new Error(`Error querying roadmap items for diagnosis: ${linkError.message}`);
  }

  if (!latestLink?.source_diagnosis_id) return null;

  const { data, error } = await supabase
    .from("business_diagnoses")
    .select("*")
    .eq("id", latestLink.source_diagnosis_id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Error fetching diagnosis with roadmap: ${error.message}`);
  }

  return data as BusinessDiagnosis;
}
