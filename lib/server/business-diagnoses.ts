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
