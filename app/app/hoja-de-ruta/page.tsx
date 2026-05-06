import { mockRoadmap } from "@/lib/mock-data";
import { Check, Circle, Sparkles } from "lucide-react";

const stageLabels: Record<string, string> = {
  exploration: "Exploración",
  constitution: "Constitución",
  tax_start: "Inicio Tributario",
  operation: "Operación Mensual",
  hiring: "Contratación",
  regularization: "Regularización",
  closing: "Cierre",
};

const statusConfig: Record<string, { label: string; badgeClass: string; dotClass: string; icon: React.ReactNode }> = {
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

export default function HojaDeRutaPage() {
  const grouped = mockRoadmap.reduce<Record<string, typeof mockRoadmap>>((acc, item) => {
    if (!acc[item.stage]) acc[item.stage] = [];
    acc[item.stage].push(item);
    return acc;
  }, {});

  const completedCount = mockRoadmap.filter((i) => i.status === "completed").length;
  const inProgressCount = mockRoadmap.filter((i) => i.status === "in_progress").length;
  const pendingCount = mockRoadmap.filter((i) => i.status === "pending" || i.status === "blocked").length;

  const stageOrder = ["exploration", "constitution", "tax_start", "operation", "hiring", "regularization", "closing"];

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-graphite">Hoja de Ruta</h1>
            <p className="text-sm text-slate mt-1">Progreso de formalización y puesta en marcha.</p>
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

        <div className="space-y-8">
          {stageOrder.map((stage) => {
            const items = grouped[stage];
            if (!items || items.length === 0) return null;

            const allCompleted = items.every((i) => i.status === "completed");
            const someInProgress = items.some((i) => i.status === "in_progress");
            const stageStatus = allCompleted ? "completed" : someInProgress ? "in_progress" : "pending";
            const stageCfg = statusConfig[stageStatus];

            return (
              <section key={stage}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center ${stageCfg.dotClass}`}>
                    {stageCfg.icon}
                  </span>
                  <h2 className="text-base font-bold text-graphite">
                    {stageLabels[stage] || stage}
                  </h2>
                  <span className="text-xs text-slate">
                    {items[0].description.split(".")[0]}
                  </span>
                </div>

                <div className="pl-10 space-y-3">
                  {items.map((item) => {
                    const cfg = statusConfig[item.status] || statusConfig.pending;
                    return (
                      <div
                        key={item.id}
                        className="bg-chalk border border-silver-mist rounded-2xl p-5 shadow-card hover:shadow-soft transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-graphite">{item.title}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${cfg.badgeClass}`}>
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-sm text-slate mt-1">{item.description}</p>
                            <a
                              href={item.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-dusk-blue hover:underline mt-2 inline-block"
                            >
                              {item.source_name}
                            </a>
                          </div>
                        </div>

                        {/* IA recommendation example for in_progress constitution */}
                        {stage === "constitution" && item.status === "in_progress" && (
                          <div className="mt-4 bg-vellum border border-silver-mist rounded-xl p-4 border-l-4 border-l-mauve">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles size={14} className="text-mauve" />
                              <span className="text-[11px] font-bold text-mauve uppercase tracking-wider">
                                Análisis IA recomendado
                              </span>
                            </div>
                            <p className="text-sm text-slate">
                              Basado en tus socios (2), recomendamos una SpA para facilitar futura entrada de capital.
                            </p>
                            <button className="mt-3 px-4 py-2 bg-graphite text-chalk text-xs font-semibold rounded-full hover:bg-ink transition-colors cursor-default">
                              Ver comparativa
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
