"use client";

import { Message, isFinancialPayload, isConstitutionPayload } from "@/lib/mock-data";

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

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xl px-4 py-3 rounded-lg text-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-100 text-gray-800 rounded-bl-none"
        }`}
      >
        <p>{message.content}</p>

        {action && isProposed && (
          <div className="mt-3 p-3 bg-white border border-gray-200 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-sm">Acción propuesta</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                {Math.round(action.confidence * 100)}% confianza
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <span className="font-medium">Intención:</span>{" "}
                {action.intent === "create_cash_expense"
                  ? "Registrar egreso"
                  : action.intent === "create_cash_income"
                  ? "Registrar ingreso"
                  : action.intent === "create_company_constitution"
                  ? "Constituir empresa"
                  : action.intent}
              </p>
              {isFinancialPayload(action.payload) && (
                <>
                  {action.payload.amount > 0 && (
                    <p>
                      <span className="font-medium">Monto:</span> $
                      {action.payload.amount.toLocaleString("es-CL")}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Categoría:</span> {action.payload.category}
                  </p>
                </>
              )}
              {isConstitutionPayload(action.payload) && (
                <p>
                  <span className="font-medium">Figura legal:</span> {action.payload.legal_type}
                </p>
              )}
              <p>
                <span className="font-medium">Descripción:</span> {action.payload.description}
              </p>
              <p>
                <span className="font-medium">Fecha:</span> {action.payload.date}
              </p>
            </div>

            {action.missing_fields.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 font-medium">Campos faltantes:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {action.missing_fields.map((field, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center space-x-2">
              <button
                onClick={() => onConfirm?.(message.id)}
                className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700"
              >
                Confirmar
              </button>
              <button
                onClick={() => onReject?.(message.id)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-300"
              >
                Rechazar
              </button>
            </div>
          </div>
        )}

        {action && isConfirmed && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700 font-medium">✅ Acción confirmada</p>
            <p className="text-xs text-green-600">
              {isFinancialPayload(action.payload)
                ? "Se registró en el Libro de Caja."
                : "Se preparará la hoja de ruta de constitución."}
            </p>
          </div>
        )}

        {action && isRejected && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700 font-medium">❌ Acción rechazada</p>
            <p className="text-xs text-red-600">
              No se registró ningún cambio.
            </p>
          </div>
        )}

        {diagnosis && isDiagnosisProposed && (
          <div className="mt-3 p-3 bg-white border border-gray-200 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-sm">Diagnóstico inicial</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                {Math.round(diagnosis.confidence * 100)}% confianza
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-700">
              <p><span className="font-medium">Rubro:</span> {diagnosis.business_profile.business_activity_category}</p>
              <p><span className="font-medium">Descripción:</span> {diagnosis.business_profile.business_description}</p>
              {diagnosis.business_profile.municipality && (
                <p><span className="font-medium">Comuna:</span> {diagnosis.business_profile.municipality}</p>
              )}
              <p><span className="font-medium">Socios:</span> {diagnosis.business_profile.has_partners === true ? "Sí" : diagnosis.business_profile.has_partners === false ? "No" : "Desconocido"}</p>
              {typeof diagnosis.business_profile.partners_count === "number" && (
                <p><span className="font-medium">Cantidad de socios:</span> {diagnosis.business_profile.partners_count}</p>
              )}
              <p><span className="font-medium">Figura legal recomendada:</span> {diagnosis.recommended_legal_type}</p>
              <p><span className="font-medium">Etapa:</span> {diagnosis.lifecycle_stage}</p>
            </div>

            {diagnosis.assumptions.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 font-medium">Supuestos:</p>
                <ul className="mt-1 space-y-0.5">
                  {diagnosis.assumptions.map((a, i) => (
                    <li key={i} className="text-xs text-gray-600">• {a}</li>
                  ))}
                </ul>
              </div>
            )}

            {diagnosis.unknowns.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 font-medium">Por confirmar:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {diagnosis.unknowns.map((u, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {diagnosis.next_steps.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 font-medium">Próximos pasos:</p>
                <ol className="mt-1 space-y-0.5 list-decimal list-inside text-xs text-gray-600">
                  {diagnosis.next_steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="mt-3 flex items-center space-x-2">
              <button
                onClick={() => onSaveDiagnosis?.(message.id)}
                className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700"
              >
                Guardar diagnóstico
              </button>
              <button
                onClick={() => onDiscardDiagnosis?.(message.id)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-300"
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        {message.diagnosis_status === "saved" && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700 font-medium">✅ Diagnóstico guardado</p>
            <p className="text-xs text-green-600">
              Se guardó en el perfil de la empresa.
            </p>
          </div>
        )}

        {message.diagnosis_status === "discarded" && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700 font-medium">❌ Diagnóstico descartado</p>
            <p className="text-xs text-red-600">
              No se guardó ningún cambio.
            </p>
          </div>
        )}

        {message.response?.assumptions && (
          <div className="mt-3 p-3 bg-white/90 border border-gray-200 rounded-md">
            <h4 className="font-semibold text-gray-900 text-sm">Supuestos:</h4>
            <ul className="mt-1 space-y-1">
              {message.response.assumptions.map((a, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start">
                  <span className="mr-2 text-blue-500">•</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {message.response?.recommendation && (
          <div className="mt-3 p-3 bg-white/90 border border-gray-200 rounded-md">
            <h4 className="font-semibold text-gray-900 text-sm">
              {message.response.recommendation.title}
            </h4>
            <p className="mt-1 text-sm text-gray-700">
              {message.response.recommendation.description}
            </p>
            <ul className="mt-2 space-y-1">
              {message.response.recommendation.options.map((opt, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start">
                  <span className="mr-2 text-blue-500">•</span>
                  {opt}
                </li>
              ))}
            </ul>
          </div>
        )}

        {message.response?.next_steps && (
          <div className="mt-3">
            <h4 className="font-semibold text-gray-900 text-sm">
              {message.response.assumptions || message.response.recommendation
                ? "Próximos pasos sugeridos:"
                : "Preguntas para orientarte:"}
            </h4>
            <ol className="mt-1 space-y-1 list-decimal list-inside text-sm text-gray-700">
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
