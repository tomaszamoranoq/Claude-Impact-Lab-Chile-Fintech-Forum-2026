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

const stageOrder = [
  "exploration",
  "constitution",
  "tax_start",
  "operation",
  "hiring",
  "regularization",
  "closing",
];

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

export default function HojaDeRutaPage() {
  const grouped = mockRoadmap.reduce<Record<string, typeof mockRoadmap>>((acc, item) => {
    if (!acc[item.stage]) acc[item.stage] = [];
    acc[item.stage].push(item);
    return acc;
  }, {});

  const completedCount = mockRoadmap.filter((i) => i.status === "completed").length;
  const inProgressCount = mockRoadmap.filter((i) => i.status === "in_progress").length;
  const pendingCount = mockRoadmap.filter(
    (i) => i.status === "pending" || i.status === "blocked"
  ).length;

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Hoja de Ruta</h1>
        <p className="mt-1 text-gray-600">
          Ciclo de vida completo de la empresa — desde la exploración hasta el cierre.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-sm text-gray-500">Completadas</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            <div className="text-sm text-gray-500">En progreso</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
            <div className="text-sm text-gray-500">Pendientes</div>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {stageOrder.map((stage) => {
            const items = grouped[stage];
            if (!items || items.length === 0) return null;
            return (
              <section key={stage}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                  {stageLabels[stage] || stage}
                </h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(
                                item.status
                              )}`}
                            >
                              {statusLabel(item.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-xs text-gray-400">
                        <span className="font-medium">Fuente:</span>
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 text-blue-500 hover:underline"
                        >
                          {item.source_name}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
