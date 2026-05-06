"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AgentAction, AgentActionStatus } from "@/lib/schemas";
import { Search, SlidersHorizontal, Sparkles, Eye, CheckCircle, XCircle } from "lucide-react";

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
  { label: string; badgeClass: string }
> = {
  proposed: {
    label: "Propuesta",
    badgeClass: "bg-blossom text-mauve border-mauve/20",
  },
  confirmed: {
    label: "Confirmada",
    badgeClass: "bg-sage/10 text-sage border-sage/20",
  },
  rejected: {
    label: "Rechazada",
    badgeClass: "bg-ash/10 text-ash border-ash/20",
  },
  executed: {
    label: "Ejecutada",
    badgeClass: "bg-blueprint/10 text-blueprint border-blueprint/20",
  },
  failed: {
    label: "Fallida",
    badgeClass: "bg-terracotta/10 text-terracotta border-terracotta/20",
  },
};

const intentLabels: Record<string, string> = {
  create_cash_income: "Registrar ingreso",
  create_cash_expense: "Registrar egreso",
  create_company_constitution: "Constituir empresa",
  create_transaction_from_document: "Registrar desde documento",
};

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
    const docRef = payload.document_name ? ` · ${payload.document_name}` : "";
    return `${typeLabel}: $${payload.amount.toLocaleString("es-CL")} · ${payload.category}${docRef}`;
  }
  if ("legal_type" in payload) {
    return `Figura legal: ${payload.legal_type}`;
  }
  return "—";
}

export default function AccionesIAPage() {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActions() {
      try {
        setLoading(true);
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

  async function handleConfirmAction(id: string) {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/agent-actions/${id}/confirm`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setActions((prev) =>
          prev.map((a) => (a.id === id ? json.data.action : a))
        );
      } else {
        alert(json.error || "Error al confirmar acción");
      }
    } catch {
      alert("Error de red al confirmar acción");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRejectAction(id: string) {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/agent-actions/${id}/reject`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setActions((prev) =>
          prev.map((a) => (a.id === id ? json.data : a))
        );
      } else {
        alert(json.error || "Error al rechazar acción");
      }
    } catch {
      alert("Error de red al rechazar acción");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-graphite">Centro de Acciones IA</h1>
          <p className="text-sm text-slate mt-1">
            Auditoría de acciones propuestas, confirmadas, ejecutadas y rechazadas por el sistema.
          </p>
        </div>

        {loading && <p className="text-sm text-ash">Cargando…</p>}
        {error && <p className="text-sm text-terracotta">{error}</p>}

        {!loading && !error && (
          <>
            {/* Search + Filters */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2 flex-1 max-w-sm px-3 py-2 bg-chalk border border-silver-mist rounded-full text-sm">
                <Search size={14} className="text-ash" />
                <input
                  type="text"
                  placeholder="Buscar acciones..."
                  className="flex-1 bg-transparent text-ink placeholder:text-ash focus:outline-none"
                />
              </div>
              <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-chalk border border-silver-mist rounded-full text-sm text-ink hover:bg-vellum transition-colors cursor-default">
                <SlidersHorizontal size={14} />
                Filtros
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-5">
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
                      "px-3 py-1.5 text-sm font-medium rounded-full border transition-colors " +
                      (active
                        ? "bg-graphite text-chalk border-graphite"
                        : "bg-chalk text-ink border-silver-mist hover:bg-vellum")
                    }
                  >
                    {f.label}
                    <span className={"ml-2 text-xs tabular-nums " + (active ? "text-chalk/60" : "text-ash")}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Table */}
            <div className="bg-chalk border border-silver-mist rounded-2xl shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-silver-mist/60">
                      {["Fecha", "Intención", "Datos detectados", "Estado", "Acción"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-[11px] font-bold text-ash uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-sm text-ash">
                          No hay acciones que coincidan con este filtro.
                        </td>
                      </tr>
                    )}
                    {filtered.map((action) => {
                      const isExpanded = expandedId === action.id;
                      const statusCfg = statusConfig[action.status];
                      const isProcessing = processingId === action.id;
                      const isProposed = action.status === "proposed";
                      const hasDocument = "document_name" in action.proposed_payload;

                      return (
                        <Fragment key={action.id}>
                          <tr
                            onClick={() => toggleExpand(action.id)}
                            className="border-b border-silver-mist/30 hover:bg-vellum/50 cursor-pointer transition-colors"
                          >
                            <td className="px-5 py-3.5 text-sm text-slate whitespace-nowrap">
                              {formatDateOnly(action.created_at)}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="text-sm font-semibold text-ink">
                                {intentLabels[action.intent] || action.intent}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <Sparkles size={12} className="text-mauve" />
                                <span className="text-[11px] text-slate">
                                  Confianza: {(action.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-slate">
                              {summarizePayload(action)}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold border ${statusCfg.badgeClass}`}
                              >
                                {statusCfg.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1.5">
                                {isProposed && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleConfirmAction(action.id);
                                      }}
                                      disabled={isProcessing}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-graphite text-chalk rounded-full text-xs font-semibold hover:bg-ink transition-colors disabled:opacity-50"
                                    >
                                      <CheckCircle size={12} />
                                      Confirmar
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRejectAction(action.id);
                                      }}
                                      disabled={isProcessing}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-chalk border border-silver-mist rounded-full text-xs text-ink hover:bg-vellum transition-colors disabled:opacity-50"
                                    >
                                      <XCircle size={12} />
                                      Rechazar
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(action.id);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-chalk border border-silver-mist rounded-full text-xs text-ink hover:bg-vellum transition-colors"
                                >
                                  <Eye size={12} />
                                  {isExpanded ? "Ocultar" : "Ver detalle"}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-vellum/40">
                              <td colSpan={5} className="px-5 py-4">
                                <div className="space-y-3 text-sm">
                                  <div>
                                    <span className="text-[11px] font-bold text-ash uppercase tracking-wider">Input</span>
                                    <p className="mt-1 text-ink bg-chalk border border-silver-mist rounded-lg px-3 py-2">
                                      {action.input_text}
                                    </p>
                                  </div>
                                  {hasDocument && (
                                    <div>
                                      <span className="text-[11px] font-bold text-ash uppercase tracking-wider">Documento asociado</span>
                                      <p className="mt-1 text-ink bg-chalk border border-silver-mist rounded-lg px-3 py-2">
                                        {(action.proposed_payload as Record<string, unknown>).document_name as string}
                                      </p>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-[11px] font-bold text-ash uppercase tracking-wider">Payload</span>
                                    <pre className="mt-1 text-xs text-ink bg-chalk border border-silver-mist rounded-lg px-3 py-2 overflow-x-auto">
                                      {JSON.stringify(action.proposed_payload, null, 2)}
                                    </pre>
                                  </div>
                                  <div className="flex flex-wrap gap-4 text-xs text-ash">
                                    <span><span className="font-semibold text-slate">ID:</span> {action.id}</span>
                                    <span><span className="font-semibold text-slate">Modelo:</span> {action.model_used}</span>
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

            <p className="mt-4 text-xs text-ash">
              {filtered.length} acción{filtered.length !== 1 ? "es" : ""} mostrada
              {filter !== "all" ? ` (filtrado: ${statusFilters.find((f) => f.key === filter)?.label})` : ""}
              {" · Total: "}{actions.length}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
