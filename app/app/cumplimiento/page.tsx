import { mockCompliance } from "@/lib/mock-data";
import { AlertTriangle, CheckCircle, Clock, XCircle, SlidersHorizontal } from "lucide-react";

const statusConfig: Record<string, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  fulfilled: {
    label: "Cumplido",
    badgeClass: "bg-sage/10 text-sage border-sage/20",
    icon: <CheckCircle size={14} className="text-sage" />,
  },
  prepared: {
    label: "Preparado",
    badgeClass: "bg-buttercup text-ochre border-ochre/20",
    icon: <Clock size={14} className="text-ochre" />,
  },
  not_applicable: {
    label: "No aplica",
    badgeClass: "bg-ash/10 text-ash border-ash/20",
    icon: <XCircle size={14} className="text-ash" />,
  },
  pending: {
    label: "Pendiente",
    badgeClass: "bg-buttercup text-ochre border-ochre/20",
    icon: <AlertTriangle size={14} className="text-ochre" />,
  },
};

export default function CumplimientoPage() {
  const pendingCount = mockCompliance.filter((c) => c.status === "pending").length;
  const preparedCount = mockCompliance.filter((c) => c.status === "prepared").length;
  const fulfilledCount = mockCompliance.filter((c) => c.status === "fulfilled").length;
  const notApplicableCount = mockCompliance.filter((c) => c.status === "not_applicable").length;

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-graphite">Calendario y estado de obligaciones tributarias, laborales y legales</h1>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Pendientes", count: pendingCount, sub: "Acción requerida", badge: "bg-buttercup text-ochre", icon: <AlertTriangle size={16} className="text-ochre" /> },
            { label: "Preparados", count: preparedCount, sub: "Revisar", badge: "bg-ash/10 text-ash", icon: <Clock size={16} className="text-ash" /> },
            { label: "Cumplidos", count: fulfilledCount, sub: "Al día", badge: "bg-sage/10 text-sage", icon: <CheckCircle size={16} className="text-sage" /> },
            { label: "No aplica", count: notApplicableCount, sub: "Inactivo", badge: "bg-ash/10 text-ash", icon: <XCircle size={16} className="text-ash" /> },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-chalk border border-silver-mist rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-ash uppercase tracking-wider">{kpi.label}</span>
                {kpi.icon}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-graphite">{kpi.count}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${kpi.badge}`}>
                  {kpi.sub}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-chalk border border-silver-mist rounded-2xl shadow-card overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-silver-mist/40">
            <h2 className="text-base font-semibold text-graphite">Obligaciones Activas</h2>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-chalk border border-silver-mist rounded-full text-xs text-ink hover:bg-vellum transition-colors cursor-default">
              <SlidersHorizontal size={12} />
              Filtrar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-silver-mist/60">
                  {["Obligación", "Formulario", "Periodo", "Vencimiento", "Estado"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-ash uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockCompliance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center">
                      <p className="text-sm font-medium text-slate">
                        Aún no hay obligaciones configuradas
                      </p>
                      <p className="text-xs text-ash mt-1">
                        Genera una hoja de ruta o registra datos de tu empresa para construir este calendario.
                      </p>
                    </td>
                  </tr>
                )}
                {mockCompliance.map((item) => {
                  const cfg = statusConfig[item.status] || statusConfig.pending;
                  return (
                    <tr key={item.id} className="border-b border-silver-mist/30 hover:bg-vellum/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-medium text-ink">{item.title}</div>
                        <div className="text-xs text-slate mt-0.5">{item.explanation}</div>
                        {item.depends_on_hiring && item.status === "not_applicable" && (
                          <div className="text-xs text-ash mt-1">Bloqueado: requiere trabajadores contratados</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate">{item.form_code}</td>
                      <td className="px-5 py-3.5 text-sm text-slate">{item.period}</td>
                      <td className="px-5 py-3.5 text-sm text-terracotta">{item.due_date}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold border ${cfg.badgeClass}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-chalk border border-silver-mist rounded-2xl p-5 shadow-card flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blossom flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-mauve" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-graphite">Entendiendo tu brújula de cumplimiento</h3>
            <p className="text-sm text-slate mt-1 leading-relaxed">
              Esta vista resume tus responsabilidades clave ante el SII y la Dirección del Trabajo.
              Mantener los KPIs &ldquo;Pendientes&rdquo; en cero asegura la salud operativa de tu empresa.
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-ash italic">
          Este calendario se completa a medida que el usuario construye su empresa en la app.
        </p>
      </div>
    </div>
  );
}
