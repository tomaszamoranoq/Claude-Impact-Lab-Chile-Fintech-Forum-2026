"use client";

import { useEffect, useState } from "react";
import {
  mockCompany,
  mockRoadmap,
  mockCompliance,
  mockTransactions,
} from "@/lib/mock-data";
import { BusinessDiagnosis } from "@/lib/schemas";

export default function EmpresaPage() {
  const [diagnosis, setDiagnosis] = useState<BusinessDiagnosis | null>(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(true);

  useEffect(() => {
    async function fetchDiagnosis() {
      try {
        const res = await fetch("/api/business-diagnosis/latest");
        const json = await res.json();
        if (json.success) {
          setDiagnosis(json.data);
        }
      } catch {
        // ignore
      } finally {
        setDiagnosisLoading(false);
      }
    }
    fetchDiagnosis();
  }, []);

  const completedTasks = mockRoadmap.filter((r) => r.status === "completed").length;
  const nextObligation = mockCompliance.find((c) => c.status === "pending");
  const income = mockTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = mockTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Empresa</h1>
        <p className="mt-1 text-gray-600">Perfil y resumen operativo de la empresa.</p>

        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Datos legales</h2>
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nombre legal</dt>
              <dd className="mt-1 text-sm text-gray-900">{mockCompany.legal_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">RUT</dt>
              <dd className="mt-1 text-sm text-gray-900">{mockCompany.rut}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Figura legal</dt>
              <dd className="mt-1 text-sm text-gray-900">{mockCompany.legal_type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Régimen tributario</dt>
              <dd className="mt-1 text-sm text-gray-900">{mockCompany.tax_regime}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Representante</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {mockCompany.representative_name} ({mockCompany.representative_rut})
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Rubro</dt>
              <dd className="mt-1 text-sm text-gray-900">{mockCompany.industry}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Comuna</dt>
              <dd className="mt-1 text-sm text-gray-900">{mockCompany.municipality}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Etapa actual</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">
                {mockCompany.lifecycle_stage.replace("_", " ")}
              </dd>
            </div>
          </dl>
        </div>

        {/* Diagnóstico inicial */}
        {!diagnosisLoading && diagnosis && (
          <div className="mt-6 bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Diagnóstico inicial</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                {Math.round(diagnosis.confidence * 100)}% confianza · {diagnosis.model_used}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Rubro detectado</dt>
                <dd className="mt-1 text-gray-900 capitalize">
                  {diagnosis.business_profile.business_activity_category.replace("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Comuna</dt>
                <dd className="mt-1 text-gray-900">
                  {diagnosis.business_profile.municipality || "—"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Socios</dt>
                <dd className="mt-1 text-gray-900">
                  {diagnosis.business_profile.has_partners === true
                    ? diagnosis.business_profile.partners_count
                      ? `${diagnosis.business_profile.partners_count} socios`
                      : "Sí (cantidad desconocida)"
                    : diagnosis.business_profile.has_partners === false
                    ? "No"
                    : "Desconocido"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Figura legal recomendada</dt>
                <dd className="mt-1 text-gray-900">{diagnosis.recommended_legal_type}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Etapa estimada</dt>
                <dd className="mt-1 text-gray-900 capitalize">
                  {diagnosis.lifecycle_stage.replace("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Planea contratar</dt>
                <dd className="mt-1 text-gray-900">
                  {diagnosis.business_profile.plans_to_hire === true
                    ? "Sí"
                    : diagnosis.business_profile.plans_to_hire === false
                    ? "No"
                    : "Desconocido"}
                </dd>
              </div>
            </div>

            {diagnosis.assumptions.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Supuestos</h3>
                <ul className="mt-1 space-y-1">
                  {diagnosis.assumptions.map((a, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start">
                      <span className="mr-2 text-blue-500">•</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {diagnosis.unknowns.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Por confirmar</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {diagnosis.unknowns.map((u, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200"
                    >
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {diagnosis.next_steps.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Próximos pasos sugeridos</h3>
                <ol className="mt-1 space-y-1 list-decimal list-inside text-sm text-gray-700">
                  {diagnosis.next_steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            <p className="mt-4 text-xs text-gray-400">
              Generado el {new Date(diagnosis.created_at).toLocaleDateString("es-CL")} · Modelo: {diagnosis.model_used}
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500">Tareas completadas</div>
            <div className="text-2xl font-bold text-green-600">
              {completedTasks} / {mockRoadmap.length}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500">Próxima obligación</div>
            <div className="text-sm font-medium text-gray-900 mt-1">
              {nextObligation ? nextObligation.title : "Ninguna pendiente"}
            </div>
            {nextObligation && (
              <div className="text-xs text-gray-500">Vence: {nextObligation.due_date}</div>
            )}
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500">Saldo de caja</div>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${balance.toLocaleString("es-CL")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
