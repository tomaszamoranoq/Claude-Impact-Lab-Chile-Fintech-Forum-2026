"use client";

import { useEffect, useState } from "react";
import {
  Company,
  mockCompany,
  mockRoadmap,
  mockCompliance,
  mockTransactions,
} from "@/lib/mock-data";
import { BusinessDiagnosis } from "@/lib/schemas";
import { Store, Pencil, Download, CheckCircle, Calendar, TrendingDown, AlertTriangle, X } from "lucide-react";

const COMPANY_PROFILE_STORAGE_KEY = "copiloto-pyme-company-profile";

const editableFields: Array<{ key: keyof Company; label: string }> = [
  { key: "legal_name", label: "Nombre legal" },
  { key: "rut", label: "RUT" },
  { key: "legal_type", label: "Figura legal" },
  { key: "tax_regime", label: "Régimen tributario" },
  { key: "representative_name", label: "Representante" },
  { key: "representative_rut", label: "RUT representante" },
  { key: "industry", label: "Rubro" },
  { key: "municipality", label: "Comuna" },
  { key: "lifecycle_stage", label: "Etapa actual" },
];

function loadStoredCompany(): Company {
  if (typeof window === "undefined") return mockCompany;
  try {
    const raw = window.localStorage.getItem(COMPANY_PROFILE_STORAGE_KEY);
    if (!raw) return mockCompany;
    return { ...mockCompany, ...JSON.parse(raw) };
  } catch {
    return mockCompany;
  }
}

function buildCompanyFile(company: Company, diagnosis: BusinessDiagnosis | null): string {
  const rows = [
    "Ficha Copiloto Pyme",
    "",
    `Nombre legal: ${company.legal_name}`,
    `RUT: ${company.rut}`,
    `Figura legal: ${company.legal_type}`,
    `Régimen tributario: ${company.tax_regime}`,
    `Representante: ${company.representative_name}`,
    `RUT representante: ${company.representative_rut}`,
    `Rubro: ${company.industry}`,
    `Comuna: ${company.municipality}`,
    `Etapa actual: ${company.lifecycle_stage}`,
  ];

  if (diagnosis) {
    rows.push(
      "",
      "Diagnóstico IA",
      `Figura recomendada: ${diagnosis.recommended_legal_type}`,
      `Etapa diagnosticada: ${diagnosis.lifecycle_stage}`,
      `Confianza: ${Math.round(diagnosis.confidence * 100)}%`
    );
  }

  return rows.join("\n");
}

export default function EmpresaPage() {
  const [diagnosis, setDiagnosis] = useState<BusinessDiagnosis | null>(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(true);
  const [company, setCompany] = useState<Company>(mockCompany);
  const [draftCompany, setDraftCompany] = useState<Company>(mockCompany);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const stored = loadStoredCompany();
    setCompany(stored);
    setDraftCompany(stored);

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

  function openEditProfile() {
    setDraftCompany(company);
    setIsEditing(true);
  }

  function saveProfile() {
    setCompany(draftCompany);
    window.localStorage.setItem(
      COMPANY_PROFILE_STORAGE_KEY,
      JSON.stringify(draftCompany)
    );
    setIsEditing(false);
  }

  function downloadProfile() {
    const file = new Blob([buildCompanyFile(company, diagnosis)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ficha-copiloto-pyme.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-graphite">Empresa</h1>
              <p className="text-sm text-slate mt-1">
                Gestiona la información legal y operativa que el usuario irá construyendo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openEditProfile}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-chalk text-ink border border-silver-mist text-sm font-medium rounded-full hover:bg-vellum transition-colors"
              >
                <Pencil size={14} />
                Editar Perfil
              </button>
              <button
                onClick={downloadProfile}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-graphite text-chalk text-sm font-medium rounded-full hover:bg-ink transition-colors"
              >
                <Download size={14} />
                Descargar Ficha
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-5">
              {/* Datos legales */}
              <div className="bg-chalk border border-silver-mist rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-linen border border-silver-mist flex items-center justify-center">
                    <Store size={20} className="text-graphite" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-graphite">Datos Legales</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sage/10 text-sage font-bold uppercase tracking-wider">
                        Activa
                      </span>
                      <span className="text-xs text-ash">Última actualización: Hoy, 09:41 AM</span>
                    </div>
                  </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { label: "Nombre legal", value: company.legal_name },
                    { label: "RUT", value: company.rut },
                    { label: "Figura legal", value: company.legal_type },
                    { label: "Régimen tributario", value: company.tax_regime },
                    { label: "Representante", value: `${company.representative_name} (${company.representative_rut})` },
                    { label: "Rubro", value: company.industry },
                    { label: "Comuna", value: company.municipality },
                    { label: "Etapa actual", value: company.lifecycle_stage.replace("_", " ") },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt className="text-[11px] font-bold text-ash uppercase tracking-wider">{item.label}</dt>
                      <dd className="mt-1 text-sm text-ink font-medium">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Diagnóstico inicial */}
              {!diagnosisLoading && diagnosis && (
                <div className="bg-chalk border border-silver-mist rounded-2xl p-6 shadow-card border-l-4 border-l-mauve">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-mauve" />
                      <h2 className="text-base font-semibold text-graphite">Sugerencia de Inteligencia Artificial</h2>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blossom text-mauve font-medium">
                      Confianza: {Math.round(diagnosis.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-slate leading-relaxed">
                    Basado en el diagnóstico inicial guardado, la empresa está en et{" "}
                    <span className="font-medium text-ink">{diagnosis.lifecycle_stage.replace("_", " ")}</span>{" "}
                    con figura legal recomendada{" "}
                    <span className="font-medium text-ink">{diagnosis.recommended_legal_type}</span>.
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <button className="px-4 py-2 bg-graphite text-chalk text-xs font-semibold rounded-full hover:bg-ink transition-colors cursor-default">
                      Revisar
                    </button>
                    <button className="px-4 py-2 bg-chalk text-ink border border-silver-mist text-xs font-semibold rounded-full hover:bg-vellum transition-colors cursor-default">
                      Ignorar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar cards */}
            <div className="space-y-5">
              {/* Tareas */}
              <div className="bg-chalk border border-silver-mist rounded-2xl p-5 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-ash uppercase tracking-wider">Tareas Completadas</span>
                  <CheckCircle size={16} className="text-sage" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-graphite">{completedTasks}</span>
                  <span className="text-sm text-ash">/ {mockRoadmap.length}</span>
                </div>
                {mockRoadmap.length === 0 && (
                  <p className="text-xs text-ash mt-2">
                    Sin hoja de ruta generada todavía.
                  </p>
                )}
              </div>

              {/* Próxima obligación */}
              <div className="bg-chalk border border-silver-mist rounded-2xl p-5 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-ash uppercase tracking-wider">Próxima Obligación</span>
                  <Calendar size={16} className="text-ochre" />
                </div>
                {nextObligation ? (
                  <>
                    <p className="text-sm font-semibold text-graphite">{nextObligation.title}</p>
                    <p className="text-xs text-ash mt-1">Vence: {nextObligation.due_date}</p>
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-buttercup text-ochre font-semibold">
                      Pendiente
                    </span>
                  </>
                ) : (
                  <p className="text-sm text-slate">Ninguna pendiente</p>
                )}
              </div>

              {/* Saldo */}
              <div className="bg-chalk border border-silver-mist rounded-2xl p-5 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-ash uppercase tracking-wider">Saldo de Caja</span>
                  <TrendingDown size={16} className={balance >= 0 ? "text-sage" : "text-terracotta"} />
                </div>
                <p className={`text-3xl font-bold ${balance >= 0 ? "text-sage" : "text-terracotta"}`}>
                  ${balance.toLocaleString("es-CL")}
                </p>
                <p className="text-xs text-slate mt-2">
                  {mockTransactions.length === 0
                    ? "Sin movimientos registrados todavía."
                    : balance >= 0
                    ? "Flujo de caja positivo."
                    : "Se requiere inyección de capital para cubrir las obligaciones de este mes."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 bg-ink/30 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-chalk border border-silver-mist rounded-2xl shadow-card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-silver-mist">
              <h2 className="text-base font-semibold text-graphite">Editar Perfil</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-vellum transition-colors"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {editableFields.map((field) => (
                <label key={field.key} className="block">
                  <span className="text-[11px] font-bold text-ash uppercase tracking-wider">
                    {field.label}
                  </span>
                  <input
                    value={String(draftCompany[field.key] || "")}
                    onChange={(e) =>
                      setDraftCompany((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 bg-chalk border border-silver-mist rounded-lg text-sm text-ink focus:outline-none focus:border-graphite"
                  />
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-silver-mist">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-chalk text-ink border border-silver-mist text-sm font-medium rounded-full hover:bg-vellum transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveProfile}
                className="px-4 py-2 bg-graphite text-chalk text-sm font-medium rounded-full hover:bg-ink transition-colors"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
