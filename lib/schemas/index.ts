import { z } from "zod";

export const confidenceSchema = z.coerce.number().min(0).max(1);

export const aiConfidenceSchema = z.preprocess((value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0.7;
}, z.number().min(0).max(1));

export const actionIntentSchema = z.enum([
  "create_cash_income",
  "create_cash_expense",
  "create_company_constitution",
]);

export const financialPayloadSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Debe ser YYYY-MM-DD"),
});

export const constitutionPayloadSchema = z.object({
  legal_type: z.enum(["Empresario Individual", "EIRL", "SpA"]),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Debe ser YYYY-MM-DD"),
});

export const actionPayloadSchema = z.union([financialPayloadSchema, constitutionPayloadSchema]);

export const agentActionStatusSchema = z.enum([
  "proposed",
  "confirmed",
  "rejected",
  "executed",
  "failed",
]);

export const agentActionSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  user_id: z.string(),
  intent: actionIntentSchema,
  input_text: z.string(),
  proposed_payload: actionPayloadSchema,
  status: agentActionStatusSchema,
  confidence: confidenceSchema,
  missing_fields: z.array(z.string()),
  model_used: z.string(),
  sources_used: z.array(z.string()),
  created_at: z.string(),
  executed_at: z.string().optional(),
});

export const createAgentActionInputSchema = z.object({
  company_id: z.string(),
  user_id: z.string(),
  intent: actionIntentSchema,
  input_text: z.string(),
  proposed_payload: actionPayloadSchema,
  confidence: confidenceSchema,
  missing_fields: z.array(z.string()),
  model_used: z.string().optional(),
  sources_used: z.array(z.string()).optional(),
});

export const cashTransactionStatusSchema = z.enum(["confirmed", "pending", "inferred"]);

export const cashTransactionSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  category: z.string(),
  date: z.string(),
  description: z.string(),
  status: cashTransactionStatusSchema,
  document_reference: z.string().optional(),
  created_at: z.string(),
});

export type ActionIntent = z.infer<typeof actionIntentSchema>;
export type FinancialPayload = z.infer<typeof financialPayloadSchema>;
export type ConstitutionPayload = z.infer<typeof constitutionPayloadSchema>;
export type ActionPayload = z.infer<typeof actionPayloadSchema>;
export type AgentActionStatus = z.infer<typeof agentActionStatusSchema>;
export type AgentAction = z.infer<typeof agentActionSchema>;
export type CreateAgentActionInput = z.infer<typeof createAgentActionInputSchema>;
export type CashTransactionStatus = z.infer<typeof cashTransactionStatusSchema>;
export type CashTransaction = z.infer<typeof cashTransactionSchema>;

export function isFinancialPayload(payload: ActionPayload): payload is FinancialPayload {
  return "amount" in payload;
}

export function isConstitutionPayload(payload: ActionPayload): payload is ConstitutionPayload {
  return "legal_type" in payload;
}

// ------------------------------------------------------------------
// Schemas para interpretación IA (Fase 3B)
// ------------------------------------------------------------------

export const aiIntentSchema = z.enum([
  "create_cash_income",
  "create_cash_expense",
  "create_company_constitution",
  "none",
]);

export const aiFinancialPayloadSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Debe ser YYYY-MM-DD"),
});

export const aiConstitutionPayloadSchema = z.object({
  legal_type: z.enum(["Empresario Individual", "EIRL", "SpA"]),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Debe ser YYYY-MM-DD"),
});

export const aiActionPayloadSchema = z.union([
  aiFinancialPayloadSchema,
  aiConstitutionPayloadSchema,
]);

export const aiInterpretationSchema = z.object({
  intent: aiIntentSchema,
  payload: aiActionPayloadSchema.optional(),
  confidence: aiConfidenceSchema,
  missing_fields: z.array(z.string()).default([]),
  reason: z.string().optional(),
  message: z.string().optional(),
});

export type AIIntent = z.infer<typeof aiIntentSchema>;
export type AIFinancialPayload = z.infer<typeof aiFinancialPayloadSchema>;
export type AIConstitutionPayload = z.infer<typeof aiConstitutionPayloadSchema>;
export type AIActionPayload = z.infer<typeof aiActionPayloadSchema>;
export type AIInterpretation = z.infer<typeof aiInterpretationSchema>;

export function isAIFinancialPayload(payload: AIActionPayload): payload is AIFinancialPayload {
  return "amount" in payload;
}

export function isAIConstitutionPayload(payload: AIActionPayload): payload is AIConstitutionPayload {
  return "legal_type" in payload;
}

// ------------------------------------------------------------------
// Schemas para diagnóstico de negocio (Fase 3C)
// ------------------------------------------------------------------

export const legalTypeRecommendationSchema = z.enum([
  "Empresario Individual",
  "EIRL",
  "SpA",
  "unknown",
]);

export const lifecycleStageSchema = z.enum([
  "exploration",
  "constitution",
  "tax_start",
  "operation",
  "hiring",
  "regularization",
  "closing",
]);

export const businessActivityCategorySchema = z.enum([
  "food",
  "retail",
  "services",
  "professional_services",
  "manufacturing",
  "digital_business",
  "transport",
  "construction",
  "health_beauty",
  "education",
  "other",
  "unknown",
]);

export const triStateSchema = z.union([
  z.literal(true),
  z.literal(false),
  z.literal("unknown"),
]);

export const businessProfileSchema = z.object({
  business_activity_category: businessActivityCategorySchema,
  business_description: z.string().min(1),
  municipality: z.string().optional(),
  has_partners: triStateSchema,
  partners_count: z.number().int().min(0).optional(),
  plans_to_hire: triStateSchema,
  operates_from_home: triStateSchema,
  expected_revenue_range: z.string().optional(),
  notes: z.string().optional(),
});

export const businessDiagnosisSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  user_id: z.string(),
  input_text: z.string(),
  business_profile: businessProfileSchema,
  recommended_legal_type: legalTypeRecommendationSchema,
  lifecycle_stage: lifecycleStageSchema,
  assumptions: z.array(z.string()).default([]),
  unknowns: z.array(z.string()).default([]),
  next_steps: z.array(z.string()).default([]),
  confidence: confidenceSchema,
  model_used: z.string(),
  created_at: z.string(),
});

export const createBusinessDiagnosisInputSchema = z.object({
  input_text: z.string(),
  business_profile: businessProfileSchema,
  recommended_legal_type: legalTypeRecommendationSchema,
  lifecycle_stage: lifecycleStageSchema,
  assumptions: z.array(z.string()).default([]),
  unknowns: z.array(z.string()).default([]),
  next_steps: z.array(z.string()).default([]),
  confidence: confidenceSchema,
  model_used: z.string(),
});

export const aiBusinessDiagnosisClassifierSchema = z.object({
  is_business_diagnosis: z.boolean(),
  message: z.string(),
});

export const aiBusinessDiagnosisEmitterSchema = z.object({
  message: z.string(),
  business_profile: businessProfileSchema,
  recommended_legal_type: legalTypeRecommendationSchema,
  lifecycle_stage: lifecycleStageSchema,
  assumptions: z.array(z.string()).default([]),
  unknowns: z.array(z.string()).default([]),
  next_steps: z.array(z.string()).default([]),
  confidence: aiConfidenceSchema,
});

// Legacy schema kept for backward compatibility if needed
export const aiBusinessDiagnosisInterpretationSchema = z.object({
  is_business_diagnosis: z.boolean(),
  message: z.string(),
  diagnosis: z
    .object({
      business_profile: businessProfileSchema,
      recommended_legal_type: legalTypeRecommendationSchema,
      lifecycle_stage: lifecycleStageSchema,
      assumptions: z.array(z.string()).default([]),
      unknowns: z.array(z.string()).default([]),
      next_steps: z.array(z.string()).default([]),
      confidence: aiConfidenceSchema,
    })
    .optional(),
});

export type LegalTypeRecommendation = z.infer<typeof legalTypeRecommendationSchema>;
export type LifecycleStage = z.infer<typeof lifecycleStageSchema>;
export type BusinessActivityCategory = z.infer<typeof businessActivityCategorySchema>;
export type TriState = z.infer<typeof triStateSchema>;
export type BusinessProfile = z.infer<typeof businessProfileSchema>;
export type BusinessDiagnosis = z.infer<typeof businessDiagnosisSchema>;
export type CreateBusinessDiagnosisInput = z.infer<typeof createBusinessDiagnosisInputSchema>;
export type AIBusinessDiagnosisClassifier = z.infer<typeof aiBusinessDiagnosisClassifierSchema>;
export type AIBusinessDiagnosisEmitter = z.infer<typeof aiBusinessDiagnosisEmitterSchema>;
export type AIBusinessDiagnosisInterpretation = z.infer<typeof aiBusinessDiagnosisInterpretationSchema>;
