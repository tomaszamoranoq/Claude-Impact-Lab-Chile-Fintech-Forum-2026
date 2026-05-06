import { mockRoadmap } from "@/lib/mock-data";
import { Check, Circle } from "lucide-react";

const stageLabels: Record<string, string> = {
  exploration: "Exploración",
  constitution: "Constitución",
  tax_start: "Inicio Tributario",
  operation: "Operación Mensual",
  hiring: "Contratación",
  regularization: "Regularización",
  closing: "Cierre",
};

const statusConfig: Record<string, { label: string; dotClass: string; icon: React.ReactNode }> = {
  completed: {
    label: "Completada",
    dotClass: "bg-sage",
    icon: <Check size={12} className="text-chalk" />,
  },
  in_progress: {
    label: "En progreso",
    dotClass: "bg-blueprint",
    icon: <Circle size={12} className="text-chalk" />,
  },
  blocked: {
    label: "Bloqueada",
    dotClass: "bg-terracotta",
    icon: <Circle size={12} className="text-chalk" />,
  },
  pending: {
    label: "Pendiente",
    dotClass: "bg-ash",
    icon: <Circle size={12} className="text-chalk" />,
  },
};

export default function RoadmapPanel() {
  const grouped = mockRoadmap.reduce<Record<string, typeof mockRoadmap>>((acc, item) => {
    if (!acc[item.stage]) acc[item.stage] = [];
    acc[item.stage].push(item);
    return acc;
  }, {});

  const stageOrder = ["exploration", "constitution", "tax_start", "operation", "hiring", "regularization", "closing"];

  return (
    <div className="w-[320px] bg-vellum border-l border-silver-mist h-screen sticky top-0 overflow-y-auto shrink-0">
      <div className="p-5 border-b border-silver-mist/40">
        <h2 className="text-base font-semibold text-graphite">Hoja de Ruta</h2>
        <p className="text-sm text-slate mt-0.5">Progreso actual de tu proyecto.</p>
      </div>
      <div className="p-4 space-y-5">
        {stageOrder.map((stage) => {
          const items = grouped[stage];
          if (!items || items.length === 0) return null;

          const allCompleted = items.every((i) => i.status === "completed");
          const someInProgress = items.some((i) => i.status === "in_progress");
          const stageStatus = allCompleted ? "completed" : someInProgress ? "in_progress" : "pending";
          const stageCfg = statusConfig[stageStatus];

          return (
            <div key={stage}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center ${stageCfg.dotClass}`}>
                  {stageCfg.icon}
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-graphite">
                  {stageLabels[stage] || stage}
                </h3>
              </div>
              <div className="space-y-2 pl-7 border-l border-silver-mist/50 ml-2.5">
                {items.map((item) => {
                  const cfg = statusConfig[item.status] || statusConfig.pending;
                  return (
                    <div
                      key={item.id}
                      className="bg-chalk border border-silver-mist rounded-xl p-3 hover:shadow-card transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-medium text-graphite truncate">{item.title}</h4>
                          </div>
                          <p className="text-xs text-slate mt-0.5 line-clamp-2">{item.description}</p>
                        </div>
                        <span
                          className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            item.status === "completed"
                              ? "bg-sage/10 text-sage"
                              : item.status === "in_progress"
                              ? "bg-blueprint/10 text-blueprint"
                              : item.status === "blocked"
                              ? "bg-terracotta/10 text-terracotta"
                              : "bg-ash/10 text-ash"
                          }`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
