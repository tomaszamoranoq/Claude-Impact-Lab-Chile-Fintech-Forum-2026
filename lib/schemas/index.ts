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
  "create_transaction_from_document",
]);

export const financialPayloadSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Debe ser YYYY-MM-DD"),
  document_id: z.string().optional(),
  document_name: z.string().optional(),
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
  "create_transaction_from_document",
  "none",
]);

export const aiFinancialPayloadSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Debe ser YYYY-MM-DD"),
  document_id: z.string().optional(),
  document_name: z.string().optional(),
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

// ------------------------------------------------------------------
// Schemas para documentos (Fase 4A)
// ------------------------------------------------------------------

export const documentFolderSchema = z.enum([
  "legal",
  "tributario",
  "rrhh",
  "operaciones",
]);

export const documentStatusSchema = z.enum([
  "uploaded",
  "pending_analysis",
  "analyzed",
  "confirmed",
  "rejected",
  "failed",
]);

export const documentRecordSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  name: z.string(),
  folder: documentFolderSchema,
  file_type: z.string(),
  mime_type: z.string().optional(),
  file_size: z.number().int().optional(),
  storage_bucket: z.string(),
  storage_path: z.string().optional(),
  status: documentStatusSchema,
  source: z.string(),
  extracted_payload: z.record(z.string(), z.unknown()).optional(),
  linked_agent_action_id: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createDocumentInputSchema = z.object({
  company_id: z.string(),
  name: z.string().min(1),
  folder: documentFolderSchema,
  file_type: z.string().min(1),
  mime_type: z.string().optional(),
  file_size: z.number().int().optional(),
  storage_bucket: z.string(),
  storage_path: z.string().optional(),
  status: documentStatusSchema.default("uploaded"),
  source: z.string().default("manual_upload"),
});

export const uploadDocumentResponseSchema = z.object({
  success: z.boolean(),
  data: documentRecordSchema,
});

export type DocumentFolder = z.infer<typeof documentFolderSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type Document = z.infer<typeof documentRecordSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;
export type UploadDocumentResponse = z.infer<typeof uploadDocumentResponseSchema>;

// ------------------------------------------------------------------
// Schemas para extracción documental (Fase 4B)
// ------------------------------------------------------------------

export const documentExtractionSchema = z.object({
  mode: z.literal("mock"),
  document_kind: z.enum([
    "invoice",
    "receipt",
    "contract",
    "tax_certificate",
    "unknown",
  ]),
  issuer_name: z.string().optional(),
  issuer_rut: z.string().optional(),
  document_date: z.string().optional(),
  total_amount: z.number().optional(),
  currency: z.string().default("CLP"),
  suggested_folder: documentFolderSchema.optional(),
  suggested_category: z.string().optional(),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()).default([]),
  fields_detected: z.record(z.string(), z.unknown()).default({}),
});

export type DocumentExtraction = z.infer<typeof documentExtractionSchema>;

// ------------------------------------------------------------------
// Schemas para roadmap items (Fase 5A)
// ------------------------------------------------------------------

export const roadmapItemStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "blocked",
]);

export const roadmapItemSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  source_diagnosis_id: z.string().optional(),
  stage: lifecycleStageSchema,
  title: z.string(),
  description: z.string(),
  status: roadmapItemStatusSchema,
  due_date: z.string().optional(),
  source_name: z.string().optional(),
  source_url: z.string().optional(),
  sort_order: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createRoadmapItemInputSchema = z.object({
  company_id: z.string(),
  source_diagnosis_id: z.string().optional(),
  stage: lifecycleStageSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  status: roadmapItemStatusSchema.default("pending"),
  due_date: z.string().optional(),
  source_name: z.string().optional(),
  source_url: z.string().optional(),
  sort_order: z.number().int().default(0),
});

export type RoadmapItemStatus = z.infer<typeof roadmapItemStatusSchema>;
export type RoadmapItem = z.infer<typeof roadmapItemSchema>;
export type CreateRoadmapItemInput = z.infer<typeof createRoadmapItemInputSchema>;

// ------------------------------------------------------------------
// Schemas para LaunchAgent output (Fase 5A)
// ------------------------------------------------------------------

export const launchAgentRoadmapItemSchema = z.object({
  stage: lifecycleStageSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  status: roadmapItemStatusSchema.default("pending"),
  due_date: z.string().optional(),
  source_name: z.string().optional(),
  source_url: z.string().optional(),
  sort_order: z.number().int().default(0),
});

export const launchAgentResultSchema = z.object({
  diagnosis: createBusinessDiagnosisInputSchema,
  roadmap_items: z.array(launchAgentRoadmapItemSchema).min(5),
  message: z.string(),
  model_used: z.string(),
  warnings: z.array(z.string()).default([]),
});

export type LaunchAgentRoadmapItem = z.infer<typeof launchAgentRoadmapItemSchema>;
export type LaunchAgentResult = z.infer<typeof launchAgentResultSchema>;

// ------------------------------------------------------------------
// Schemas para clasificación de intenciones (Fase 5C)
// ------------------------------------------------------------------

export const agentNameSchema = z.enum([
  "launch",
  "operations",
  "documents",
  "compliance",
  "labor",
  "resolution",
]);

export const intentClassificationSchema = z.object({
  agent_name: agentNameSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  missing_context: z.array(z.string()).default([]),
});

export type IntentClassificationData = z.infer<typeof intentClassificationSchema>;

// ------------------------------------------------------------------
// AgentName type export & mode schema (Fase 5D-A)
// ------------------------------------------------------------------

export type AgentName = z.infer<typeof agentNameSchema>;

export const agentModeSchema = z.enum(["chat", "execute"]);

export type AgentMode = z.infer<typeof agentModeSchema>;
