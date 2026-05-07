import { supabase } from "./supabase"

export interface AuditEventData {
  companyId?: string
  userId?: string
  inputText?: string
  endpoint: string
  selectedAgent?: string
  classifierUsed?: string
  classifierModel?: string
  confidence?: number
  reason?: string
  success: boolean
  modelUsed?: string
  error?: string
}

export async function createAuditEvent(data: AuditEventData): Promise<void> {
  try {
    const { error } = await supabase.from("audit_events").insert({
      company_id: data.companyId || null,
      user_id: data.userId || null,
      input_text: data.inputText || null,
      endpoint: data.endpoint,
      selected_agent: data.selectedAgent || null,
      classifier_used: data.classifierUsed || null,
      classifier_model: data.classifierModel || null,
      confidence: data.confidence ?? null,
      reason: data.reason || null,
      success: data.success,
      model_used: data.modelUsed || null,
      error: data.error || null,
    })
    if (error) {
      console.error("Audit event insert failed:", error.message)
    }
  } catch (err) {
    console.error(
      "Audit event insert failed:",
      err instanceof Error ? err.message : String(err)
    )
  }
}
