"use client";

import { useEffect, useState } from "react";
import { CashTransaction } from "@/lib/schemas";

const statusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-700";
    case "inferred":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "confirmed":
      return "Confirmado";
    case "inferred":
      return "Inferido";
    default:
      return "Pendiente";
  }
};

export default function LibroDeCajaPage() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch("/api/cash-transactions");
        const json = await res.json();
        if (json.success) {
          setTransactions(json.data);
        } else {
          setError(json.error || "Error al cargar transacciones");
        }
      } catch {
        setError("Error de red al cargar transacciones");
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Libro de Caja</h1>
        <p className="mt-1 text-gray-600">
          Registro de ingresos y egresos de la empresa.
        </p>

        {loading && <p className="mt-4 text-sm text-gray-500">Cargando...</p>}
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500">Saldo actual</div>
                <div className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${balance.toLocaleString("es-CL")}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500">Ingresos (mayo)</div>
                <div className="text-2xl font-bold text-green-600">
                  ${income.toLocaleString("es-CL")}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500">Egresos (mayo)</div>
                <div className="text-2xl font-bold text-red-600">
                  ${expense.toLocaleString("es-CL")}
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">{t.date}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            t.type === "income"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {t.type === "income" ? "Ingreso" : "Egreso"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{t.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{t.description}</td>
                      <td
                        className={`px-6 py-4 text-sm text-right font-medium ${
                          t.type === "income" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}${t.amount.toLocaleString("es-CL")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(
                            t.status
                          )}`}
                        >
                          {statusLabel(t.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {t.document_reference || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="mt-4 text-xs text-gray-400">
          Datos, fechas y fuentes simulados para demo. No constituyen información contable o legal vigente.
        </p>
      </div>
    </div>
  );
}
