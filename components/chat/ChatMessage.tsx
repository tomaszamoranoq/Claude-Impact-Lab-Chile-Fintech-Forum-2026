"use client";

import { Message, isFinancialPayload, isConstitutionPayload } from "@/lib/mock-data";
import { Sparkles, Check, X, Save, Trash2, AlertTriangle } from "lucide-react";
import ComplianceCard, { type ComplianceCardData } from "./ComplianceCard";
import OperationsCard, { type OperationsCardData } from "./OperationsCard";

interface Props {
  message: Message;
  onConfirm?: (messageId: string) => void;
  onReject?: (messageId: string) => void;
  onSaveDiagnosis?: (messageId: string) => void;
  onDiscardDiagnosis?: (messageId: string) => void;
}

export default function ChatMessage({ message, onConfirm, onReject, onSaveDiagnosis, onDiscardDiagnosis }: Props) {
  const isUser = message.role === "user";
  const action = message.response?.proposed_action;
  const isProposed = message.action_status === "proposed";
  const isConfirmed = message.action_status === "confirmed";
  const isRejected = message.action_status === "rejected";
  const diagnosis = message.diagnosis;
  const isDiagnosisProposed = message.diagnosis_status === "proposed";
  const isDiagnosisSaved = message.diagnosis_status === "saved";
  const showDiagnosisCard = diagnosis && (isDiagnosisProposed || isDiagnosisSaved);

  const isCompliance = message.agent_response?.agent === "compliance";
  const complianceData = isCompliance ? message.agent_response!.data as ComplianceCardData : null;

  const isOperations = message.agent_response?.agent === "operations";
  const operationsData = isOperations ? message.agent_response!.data as OperationsCardData : null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xl text-sm ${
          isUser
            ? "bg-graphite text-chalk rounded-2xl rounded-br-md px-5 py-3"
            : "bg-chalk border border-silver-mist text-ink rounded-2xl rounded-bl-md px-5 py-3 shadow-card"
        }`}
      >
        <p className="leading-relaxed">{message.content}</p>

        {/* Action proposed */}
        {action && isProposed && (
          <div className="mt-4 bg-vellum border border-silver-mist rounded-xl overflow-hidden">
            <div className="border-l-4 border-mauve px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-mauve" />
                  <h4 className="font-semibold text-graphite text-sm">Acción propuesta por IA</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-silver-mist/40 text-slate font-medium">
                    Intención: {action.intent === "create_cash_expense" ? "Registrar egreso" : action.intent === "create_cash_income" ? "Registrar ingreso" : action.intent === "create_company_constitution" ? "Crear empresa" : action.intent}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blossom text-mauve font-medium">
                    Confianza: {Math.round(action.confidence * 100)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-ink">
                {isFinancialPayload(action.payload) && (
                  <>
                    {action.payload.amount > 0 && (
                      <div>
                        <span className="text-xs text-slate block">Monto</span>
                        <span className="font-medium">${action.payload.amount.toLocaleString("es-CL")}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-slate block">Categoría</span>
                      <span className="font-medium">{action.payload.category}</span>
                    </div>
                  </>
                )}
                {isConstitutionPayload(action.payload) && (
                  <div>
                    <span className="text-xs text-slate block">Figura legal</span>
                    <span className="font-medium">{action.payload.legal_type}</span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate block">Descripción</span>
                  <span className="font-medium">{action.payload.description}</span>
                </div>
                <div>
                  <span className="text-xs text-slate block">Fecha</span>
                  <span className="font-medium">{action.payload.date}</span>
                </div>
              </div>

              {action.missing_fields.length > 0 && (
                <div className="mt-3 flex items-start gap-2 bg-buttercup/40 rounded-lg px-3 py-2">
                  <AlertTriangle size={14} className="text-ochre mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-ochre font-medium">Campos faltantes:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {action.missing_fields.map((field, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-chalk text-ochre border border-ochre/20"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => onConfirm?.(message.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-graphite text-chalk text-xs font-semibold rounded-full hover:bg-ink transition-colors"
                >
                  <Check size={14} />
                  Confirmar
                </button>
                <button
                  onClick={() => onReject?.(message.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-chalk text-ink border border-silver-mist text-xs font-semibold rounded-full hover:bg-vellum transition-colors"
                >
                  <X size={14} />
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action confirmed/rejected */}
        {action && isConfirmed && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-sage/10 border border-sage/20 rounded-lg">
            <Check size={14} className="text-sage" />
            <p className="text-sm text-sage font-medium">
              {isFinancialPayload(action.payload) ? "Acción confirmada y registrada en Libro de Caja" : "Acción confirmada"}
            </p>
          </div>
        )}
        {action && isRejected && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-terracotta/10 border border-terracotta/20 rounded-lg">
            <X size={14} className="text-terracotta" />
            <p className="text-sm text-terracotta font-medium">Acción rechazada</p>
          </div>
        )}

        {/* Diagnosis proposed / saved */}
        {showDiagnosisCard && (
          <div className="mt-4 bg-vellum border border-silver-mist rounded-xl overflow-hidden">
            <div className="border-l-4 border-mauve px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-mauve" />
                  <h4 className="font-semibold text-graphite text-sm">Diagnóstico inicial</h4>
                </div>
                <div className="flex items-center gap-2">
                  {isDiagnosisSaved && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-sage/10 text-sage font-medium flex items-center gap-1">
                      <Check size={11} />
                      Guardado
                    </span>
                  )}
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blossom text-mauve font-medium">
                    {Math.round(diagnosis.confidence * 100)}% confianza
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-ink">
                <div>
                  <span className="text-xs text-slate block">Rubro</span>
                  <span className="font-medium capitalize">{diagnosis.business_profile.business_activity_category.replace("_", " ")}</span>
                </div>
                <div>
                  <span className="text-xs text-slate block">Comuna</span>
                  <span className="font-medium">{diagnosis.business_profile.municipality || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-slate block">Socios</span>
                  <span className="font-medium">
                    {diagnosis.business_profile.has_partners === true
                      ? diagnosis.business_profile.partners_count
                        ? `${diagnosis.business_profile.partners_count} socios`
                        : "Sí"
                      : diagnosis.business_profile.has_partners === false
                      ? "No"
                      : "Desconocido"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate block">Figura legal</span>
                  <span className="font-medium">{diagnosis.recommended_legal_type}</span>
                </div>
                <div>
                  <span className="text-xs text-slate block">Etapa</span>
                  <span className="font-medium capitalize">{diagnosis.lifecycle_stage.replace("_", " ")}</span>
                </div>
                <div>
                  <span className="text-xs text-slate block">Contratar</span>
                  <span className="font-medium">
                    {diagnosis.business_profile.plans_to_hire === true ? "Sí" : diagnosis.business_profile.plans_to_hire === false ? "No" : "Desconocido"}
                  </span>
                </div>
              </div>

              {diagnosis.assumptions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-slate font-medium">Supuestos</p>
                  <ul className="mt-1 space-y-0.5">
                    {diagnosis.assumptions.map((a, i) => (
                      <li key={i} className="text-xs text-ink flex items-start gap-1.5">
                        <span className="text-blueprint mt-0.5">•</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {diagnosis.unknowns.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-slate font-medium">Por confirmar</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {diagnosis.unknowns.map((u, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-buttercup text-ochre border border-ochre/20">
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {diagnosis.next_steps.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-slate font-medium">Próximos pasos</p>
                  <ol className="mt-1 space-y-0.5 list-decimal list-inside text-xs text-ink">
                    {diagnosis.next_steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {isDiagnosisProposed && (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => onSaveDiagnosis?.(message.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-graphite text-chalk text-xs font-semibold rounded-full hover:bg-ink transition-colors"
                  >
                    <Save size={14} />
                    Guardar diagnóstico
                  </button>
                  <button
                    onClick={() => onDiscardDiagnosis?.(message.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-chalk text-ink border border-silver-mist text-xs font-semibold rounded-full hover:bg-vellum transition-colors"
                  >
                    <Trash2 size={14} />
                    Descartar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {message.diagnosis_status === "discarded" && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-terracotta/10 border border-terracotta/20 rounded-lg">
            <Trash2 size={14} className="text-terracotta" />
            <p className="text-sm text-terracotta font-medium">Diagnóstico descartado</p>
          </div>
        )}

        {/* Compliance card */}
        {isCompliance && complianceData && (
          <ComplianceCard data={complianceData} />
        )}

        {/* Operations card */}
        {isOperations && operationsData && (
          <OperationsCard data={operationsData} />
        )}

        {message.response?.assumptions && (
          <div className="mt-3 p-3 bg-vellum border border-silver-mist rounded-xl">
            <h4 className="font-semibold text-graphite text-sm">Supuestos</h4>
            <ul className="mt-1 space-y-1">
              {message.response.assumptions.map((a, i) => (
                <li key={i} className="text-sm text-slate flex items-start gap-1.5">
                  <span className="text-blueprint mt-0.5">•</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {message.response?.recommendation && (
          <div className="mt-3 p-3 bg-vellum border border-silver-mist rounded-xl">
            <h4 className="font-semibold text-graphite text-sm">{message.response.recommendation.title}</h4>
            <p className="mt-1 text-sm text-slate">{message.response.recommendation.description}</p>
            <ul className="mt-2 space-y-1">
              {message.response.recommendation.options.map((opt, i) => (
                <li key={i} className="text-sm text-slate flex items-start gap-1.5">
                  <span className="text-blueprint mt-0.5">•</span>
                  {opt}
                </li>
              ))}
            </ul>
          </div>
        )}

        {message.response?.next_steps && (
          <div className="mt-3">
            <h4 className="font-semibold text-graphite text-sm">
              {message.response.assumptions || message.response.recommendation
                ? "Próximos pasos"
                : "Preguntas para orientarte"}
            </h4>
            <ol className="mt-1 space-y-1 list-decimal list-inside text-sm text-slate">
              {message.response.next_steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
