"use client";

import { useEffect, useState } from "react";
import { CashTransaction } from "@/lib/schemas";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

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
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-graphite">Registro de ingresos y egresos de la empresa</h1>
          <p className="text-sm text-slate mt-1">
            Consulta el flujo de caja, movimientos confirmados y conciliaciones bancarias.
          </p>
        </div>

        {loading && <p className="text-sm text-ash">Cargando...</p>}
        {error && <p className="text-sm text-terracotta">{error}</p>}

        {!loading && !error && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-chalk border border-silver-mist rounded-2xl p-5 shadow-card">
                <p className="text-[11px] font-bold text-ash uppercase tracking-wider">Ingresos Totales (Mes)</p>
                <p className="text-2xl font-bold text-graphite mt-2">${income.toLocaleString("es-CL")}</p>
              </div>
              <div className="bg-chalk border border-silver-mist rounded-2xl p-5 shadow-card">
                <p className="text-[11px] font-bold text-ash uppercase tracking-wider">Egresos Totales (Mes)</p>
                <p className="text-2xl font-bold text-terracotta mt-2">${expense.toLocaleString("es-CL")}</p>
              </div>
              <div className="bg-chalk border border-silver-mist rounded-2xl p-5 shadow-card">
                <p className="text-[11px] font-bold text-ash uppercase tracking-wider">Saldo</p>
                <p className={`text-2xl font-bold mt-2 ${balance >= 0 ? "text-sage" : "text-terracotta"}`}>
                  ${balance.toLocaleString("es-CL")}
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-chalk border border-silver-mist rounded-2xl shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-silver-mist/60">
                      {["Fecha", "Concepto", "Categoría", "Tipo", "Monto", "Estado"].map((h) => (
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
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-silver-mist/30 hover:bg-vellum/50 transition-colors">
                        <td className="px-5 py-3.5 text-sm text-slate whitespace-nowrap">{t.date}</td>
                        <td className="px-5 py-3.5 text-sm text-ink font-medium">{t.description}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] px-2.5 py-1 rounded-full bg-vellum border border-silver-mist text-slate font-medium">
                            {t.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {t.type === "income" ? (
                            <ArrowDownLeft size={16} className="text-sage" />
                          ) : (
                            <ArrowUpRight size={16} className="text-terracotta" />
                          )}
                        </td>
                        <td className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap ${t.type === "income" ? "text-sage" : "text-terracotta"}`}>
                          {t.type === "income" ? "+" : "-"}${t.amount.toLocaleString("es-CL")}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-sage/10 text-sage font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                            Confirmado
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-4 text-xs text-ash italic">
              Datos, fechas y fuentes simulados para demo. No constituyen información contable o legal vigente.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
