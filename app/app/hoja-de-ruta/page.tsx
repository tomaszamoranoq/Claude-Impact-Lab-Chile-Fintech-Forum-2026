"use client";

import { useEffect, useState } from "react";
import { RoadmapItem, RoadmapItemStatus } from "@/lib/schemas";
import { Check, Circle, Sparkles, ArrowRight } from "lucide-react";

const stageLabels: Record<string, string> = {
  exploration: "Exploración",
  constitution: "Constitución",
  tax_start: "Inicio Tributario",
  operation: "Operación Mensual",
  hiring: "Contratación",
  regularization: "Regularización",
  closing: "Cierre",
};

const statusConfig: Record<
  RoadmapItemStatus,
  { label: string; badgeClass: string; dotClass: string; icon: React.ReactNode }
> = {
  completed: {
    label: "Completado",
    badgeClass: "bg-sage/10 text-sage border-sage/20",
    dotClass: "bg-sage",
    icon: <Check size={12} className="text-chalk" />,
  },
  in_progress: {
    label: "En progreso",
    badgeClass: "bg-blueprint/10 text-blueprint border-blueprint/20",
    dotClass: "bg-blueprint",
    icon: <Circle size={12} className="text-chalk" />,
  },
  blocked: {
    label: "Bloqueada",
    badgeClass: "bg-terracotta/10 text-terracotta border-terracotta/20",
    dotClass: "bg-terracotta",
    icon: <Circle size={12} className="text-chalk" />,
  },
  pending: {
    label: "Pendiente",
    badgeClass: "bg-buttercup text-ochre border-ochre/20",
    dotClass: "bg-ochre",
    icon: <Circle size={12} className="text-chalk" />,
  },
};

const stageOrder = [
  "exploration",
  "constitution",
  "tax_start",
  "operation",
  "hiring",
  "regularization",
  "closing",
];

export default function HojaDeRutaPage() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true);
        const res = await fetch("/api/roadmap-items");
        const json = await res.json();
        if (json.success) {
          setItems(json.data);
        } else {
          setError(json.error || "Error al cargar hoja de ruta");
        }
      } catch {
        setError("Error de red al cargar hoja de ruta");
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, []);

  const grouped = items.reduce<Record<string, RoadmapItem[]>>((acc, item) => {
    if (!acc[item.stage]) acc[item.stage] = [];
    acc[item.stage].push(item);
    return acc;
  }, {});

  const completedCount = items.filter((i) => i.status === "completed").length;
  const inProgressCount = items.filter((i) => i.status === "in_progress").length;
  const pendingCount = items.filter(
    (i) => i.status === "pending" || i.status === "blocked"
  ).length;

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-graphite">Hoja de Ruta</h1>
            <p className="text-sm text-slate mt-1">
              Progreso de formalización y puesta en marcha.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full bg-sage/10 text-sage font-semibold border border-sage/20">
              <span className="w-1.5 h-1.5 rounded-full bg-sage" />
              {completedCount} Completadas
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full bg-blueprint/10 text-blueprint font-semibold border border-blueprint/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blueprint" />
              {inProgressCount} En progreso
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full bg-buttercup text-ochre font-semibold border border-ochre/20">
              <span className="w-1.5 h-1.5 rounded-full bg-ochre" />
              {pendingCount} Pendientes
            </span>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-ash">Cargando…</p>
        ) : error ? (
          <p className="text-sm text-terracotta">{error}</p>
        ) : items.length === 0 ? (
          <div className="bg-chalk border border-silver-mist rounded-2xl p-12 shadow-card text-center">
            <div className="w-12 h-12 rounded-full bg-linen border border-silver-mist flex items-center justify-center mx-auto mb-4">
              <Sparkles size={20} className="text-mauve" />
            </div>
            <h2 className="text-base font-semibold text-graphite mb-2">
              No hay hoja de ruta generada
            </h2>
            <p className="text-sm text-slate mb-6 max-w-sm mx-auto">
              Usa el Asesor Inicial para contar sobre tu negocio y generar una hoja de ruta personalizada.
            </p>
            <a
              href="/app/asesor-inicial"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-graphite text-chalk text-sm font-semibold rounded-full hover:bg-ink transition-colors"
            >
              <Sparkles size={16} />
              Generar hoja de ruta inicial
              <ArrowRight size={14} />
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {stageOrder.map((stage) => {
              const stageItems = grouped[stage];
              if (!stageItems || stageItems.length === 0) return null;

              const allCompleted = stageItems.every((i) => i.status === "completed");
              const someInProgress = stageItems.some((i) => i.status === "in_progress");
              const stageStatus = allCompleted
                ? "completed"
                : someInProgress
                ? "in_progress"
                : "pending";
              const stageCfg = statusConfig[stageStatus];

              return (
                <section key={stage}>
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${stageCfg.dotClass}`}
                    >
                      {stageCfg.icon}
                    </span>
                    <h2 className="text-base font-bold text-graphite">
                      {stageLabels[stage] || stage}
                    </h2>
                    <span className="text-xs text-slate">
                      {stageItems.length} tarea{stageItems.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="pl-10 space-y-3">
                    {stageItems.map((item) => {
                      const cfg = statusConfig[item.status] || statusConfig.pending;
                      return (
                        <div
                          key={item.id}
                          className="bg-chalk border border-silver-mist rounded-2xl p-5 shadow-card hover:shadow-soft transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-semibold text-graphite">
                                  {item.title}
                                </h3>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${cfg.badgeClass}`}
                                >
                                  {cfg.label}
                                </span>
                              </div>
                              <p className="text-sm text-slate mt-1">
                                {item.description}
                              </p>
                              {item.source_name && item.source_url && (
                                <a
                                  href={item.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-dusk-blue hover:underline mt-2 inline-block"
                                >
                                  {item.source_name}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
