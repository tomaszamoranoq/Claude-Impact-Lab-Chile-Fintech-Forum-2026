import { mockRoadmap } from "@/lib/mock-data";

const stageLabels: Record<string, string> = {
  exploration: "Exploración",
  constitution: "Constitución",
  tax_start: "Inicio Tributario",
  operation: "Operación Mensual",
  hiring: "Contratación",
  regularization: "Regularización",
  closing: "Cierre",
};

const statusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "in_progress":
      return "bg-blue-100 text-blue-700";
    case "blocked":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Completada";
    case "in_progress":
      return "En progreso";
    case "blocked":
      return "Bloqueada";
    default:
      return "Pendiente";
  }
};

export default function RoadmapPanel() {
  const grouped = mockRoadmap.reduce<Record<string, typeof mockRoadmap>>((acc, item) => {
    if (!acc[item.stage]) acc[item.stage] = [];
    acc[item.stage].push(item);
    return acc;
  }, {});

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-screen sticky top-0 overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">Hoja de Ruta</h2>
        <p className="text-sm text-gray-500 mt-1">Ciclo de vida de la empresa</p>
      </div>
      <div className="p-4 space-y-6">
        {Object.entries(grouped).map(([stage, items]) => (
          <div key={stage}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              {stageLabels[stage] || stage}
            </h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border border-gray-200 rounded-md hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{item.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(
                        item.status
                      )}`}
                    >
                      {statusLabel(item.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
