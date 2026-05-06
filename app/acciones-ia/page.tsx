"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AgentAction, AgentActionStatus } from "@/lib/schemas";

type FilterStatus = AgentActionStatus | "all";

const statusFilters: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "proposed", label: "Propuestas" },
  { key: "executed", label: "Ejecutadas" },
  { key: "confirmed", label: "Confirmadas" },
  { key: "rejected", label: "Rechazadas" },
  { key: "failed", label: "Fallidas" },
];

const statusConfig: Record<
  AgentActionStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  proposed: {
    label: "Propuesta",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    dotClass: "bg-blue-500",
  },
  confirmed: {
    label: "Confirmada",
    badgeClass: "bg-green-50 text-green-700 border-green-200",
    dotClass: "bg-green-500",
  },
  rejected: {
    label: "Rechazada",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    dotClass: "bg-red-500",
  },
  executed: {
    label: "Ejecutada",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    dotClass: "bg-purple-500",
  },
  failed: {
    label: "Fallida",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-300",
    dotClass: "bg-gray-500",
  },
};

const intentLabels: Record<string, string> = {
  create_cash_income: "Registrar ingreso",
  create_cash_expense: "Registrar egreso",
  create_company_constitution: "Constituir empresa",
};

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

function formatDateOnly(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

function summarizePayload(action: AgentAction): string {
  const payload = action.proposed_payload;
  if ("amount" in payload) {
    const typeLabel = payload.type === "income" ? "Ingreso" : "Egreso";
    return `${typeLabel}: $${payload.amount.toLocaleString("es-CL")} · ${payload.category}`;
  }
  if ("legal_type" in payload) {
    return `Figura legal: ${payload.legal_type}`;
  }
  return "—";
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

export default function AccionesIAPage() {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActions() {
      try {
        const res = await fetch("/api/agent-actions");
        const json = await res.json();
        if (json.success) {
          setActions(json.data);
        } else {
          setError(json.error || "Error al cargar acciones");
        }
      } catch {
        setError("Error de red al cargar acciones");
      } finally {
        setLoading(false);
      }
    }
    fetchActions();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return actions;
    return actions.filter((a) => a.status === filter);
  }, [actions, filter]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Centro de Acciones IA</h1>
        <p className="mt-1 text-gray-600">
          Auditoría de acciones propuestas, confirmadas, ejecutadas y rechazadas por el sistema.
        </p>

        {loading && <p className="mt-6 text-sm text-gray-500">Cargando…</p>}
        {error && <p className="mt-6 text-sm text-red-500">{error}</p>}

        {!loading && !error && (
          <>
            {/* Filtros */}
            <div className="mt-6 flex flex-wrap gap-2">
              {statusFilters.map((f) => {
                const count =
                  f.key === "all"
                    ? actions.length
                    : actions.filter((a) => a.status === f.key).length;
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={
                      "px-3 py-1.5 text-sm font-medium rounded-md border transition-colors " +
                      (active
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50")
                    }
                  >
                    {f.label}
                    <span
                      className={
                        "ml-2 text-xs tabular-nums " +
                        (active ? "text-gray-300" : "text-gray-400")
                      }
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tabla */}
            <div className="mt-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                        Intención
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Confianza
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Input original
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        Payload resumido
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Campos faltantes
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                        Modelo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-sm text-gray-500"
                        >
                          No hay acciones que coincidan con este filtro.
                        </td>
                      </tr>
                    )}
                    {filtered.map((action) => {
                      const isExpanded = expandedId === action.id;
                      const statusCfg = statusConfig[action.status];
                      return (
                        <Fragment key={action.id}>
                          <tr
                            onClick={() => toggleExpand(action.id)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                              {formatDateOnly(action.created_at)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                              {intentLabels[action.intent] || action.intent}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${statusCfg.badgeClass}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`}
                                />
                                {statusCfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap tabular-nums">
                              {(action.confidence * 100).toFixed(0)}%
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                              {truncate(action.input_text, 60)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                              {summarizePayload(action)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div className="flex flex-wrap gap-1">
                                {action.missing_fields.length > 0 ? (
                                  action.missing_fields.map((field) => (
                                    <span
                                      key={field}
                                      className="inline-block px-1.5 py-0.5 text-xs bg-yellow-50 text-yellow-700 rounded border border-yellow-200"
                                    >
                                      {field}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-400 text-xs">—</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                              {action.model_used}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-gray-50/50">
                              <td colSpan={8} className="px-4 py-4">
                                <div className="space-y-3 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">
                                      Input completo:
                                    </span>
                                    <p className="mt-1 text-gray-900 bg-white border border-gray-200 rounded-md px-3 py-2">
                                      {action.input_text}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">
                                      Payload propuesto:
                                    </span>
                                    <pre className="mt-1 text-xs text-gray-800 bg-white border border-gray-200 rounded-md px-3 py-2 overflow-x-auto">
                                      {JSON.stringify(
                                        action.proposed_payload,
                                        null,
                                        2
                                      )}
                                    </pre>
                                  </div>
                                  <div className="flex flex-wrap gap-6 text-xs text-gray-500">
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        ID:
                                      </span>{" "}
                                      {action.id}
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Intención técnica:
                                      </span>{" "}
                                      {action.intent}
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Creada:
                                      </span>{" "}
                                      {formatDate(action.created_at)}
                                    </div>
                                    {action.executed_at && (
                                      <div>
                                        <span className="font-medium text-gray-600">
                                          Ejecutada:
                                        </span>{" "}
                                        {formatDate(action.executed_at)}
                                      </div>
                                    )}
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Fuentes:
                                      </span>{" "}
                                      {action.sources_used.length > 0
                                        ? action.sources_used.join(", ")
                                        : "—"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              {filtered.length} acción
              {filtered.length !== 1 ? "es" : ""} mostrada
              {filter !== "all" ? ` (filtrado: ${statusFilters.find((f) => f.key === filter)?.label})` : ""}
              {" "}· Total: {actions.length}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
