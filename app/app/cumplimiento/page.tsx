import { mockCompliance } from "@/lib/mock-data";

const statusBadge = (status: string) => {
  switch (status) {
    case "fulfilled":
      return "bg-green-100 text-green-700";
    case "prepared":
      return "bg-yellow-100 text-yellow-700";
    case "not_applicable":
      return "bg-gray-100 text-gray-400";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "fulfilled":
      return "Cumplido";
    case "prepared":
      return "Preparado";
    case "not_applicable":
      return "No aplica";
    default:
      return "Pendiente";
  }
};

export default function CumplimientoPage() {
  const pendingCount = mockCompliance.filter((c) => c.status === "pending").length;
  const preparedCount = mockCompliance.filter((c) => c.status === "prepared").length;
  const fulfilledCount = mockCompliance.filter((c) => c.status === "fulfilled").length;
  const notApplicableCount = mockCompliance.filter((c) => c.status === "not_applicable").length;

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Cumplimiento</h1>
        <p className="mt-1 text-gray-600">
          Calendario y estado de obligaciones tributarias, laborales y legales.
        </p>

        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
            <div className="text-sm text-gray-500">Pendientes</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{preparedCount}</div>
            <div className="text-sm text-gray-500">Preparados</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{fulfilledCount}</div>
            <div className="text-sm text-gray-500">Cumplidos</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-400">{notApplicableCount}</div>
            <div className="text-sm text-gray-500">No aplica</div>
          </div>
        </div>

        <div className="mt-8 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Obligación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Formulario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Periodo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockCompliance.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.explanation}</div>
                    {item.depends_on_hiring && item.status === "not_applicable" && (
                      <div className="text-xs text-gray-400 mt-1">
                        Bloqueado: requiere tener trabajadores contratados
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.form_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.period}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.due_date}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(
                        item.status
                      )}`}
                    >
                      {statusLabel(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          Datos, fechas y fuentes simulados para demo. No constituyen información legal vigente.
        </p>
      </div>
    </div>
  );
}
