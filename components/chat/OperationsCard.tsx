"use client";

import { Wallet } from "lucide-react";

const TOPIC_LABELS: Record<string, string> = {
  cashbook: "Libro de caja",
  balance: "Saldo",
  expenses: "Egresos",
  income: "Ingresos",
  invoice_payment: "Facturas y pagos",
  categorization: "Categorización",
  missing_amount: "Datos faltantes",
  general: "Operaciones",
};

const TOPIC_BORDER: Record<string, string> = {
  balance: "border-sage",
  expenses: "border-terracotta",
  income: "border-sage",
  cashbook: "border-blueprint",
  categorization: "border-mauve",
  missing_amount: "border-ochre",
  invoice_payment: "border-blueprint",
  general: "border-blueprint",
};

const SUMMARY_TOPICS = ["balance", "expenses", "income"];
const CATEGORY_TOPICS = ["balance", "expenses", "income", "categorization"];

interface TransactionItem {
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface CategorySummary {
  category: string;
  count: number;
  total: number;
}

interface OperationsCardData {
  topic: string;
  summary?: {
    current_balance?: number;
    monthly_income?: number;
    monthly_expenses?: number;
    transaction_count?: number;
    last_transactions?: TransactionItem[];
    top_categories?: CategorySummary[];
  };
  insights?: string[];
  suggested_categories?: string[];
  missing_context?: string[];
  next_steps?: string[];
}

interface Props {
  data: OperationsCardData;
}

export default function OperationsCard({ data }: Props) {
  const topic = data.topic || "general";
  const topicLabel = TOPIC_LABELS[topic] || topic;
  const borderColor = TOPIC_BORDER[topic] || "border-blueprint";
  const summary = data.summary;
  const showSummary = SUMMARY_TOPICS.includes(topic) && summary;
  const showCategories = CATEGORY_TOPICS.includes(topic) && summary?.top_categories && summary.top_categories.length > 0;
  const showTransactions = summary?.last_transactions && summary.last_transactions.length > 0;
  const showDisclaimer = showSummary || showTransactions;

  const filteredTransactions = (() => {
    if (!summary?.last_transactions) return [];
    if (topic === "expenses") return summary.last_transactions.filter((t) => t.type === "expense").slice(0, 5);
    if (topic === "income") return summary.last_transactions.filter((t) => t.type === "income").slice(0, 5);
    return summary.last_transactions.slice(0, 5);
  })();

  return (
    <div className="mt-4 bg-vellum border border-silver-mist rounded-xl overflow-hidden">
      <div className={`border-l-4 ${borderColor} px-4 py-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={14} className="text-graphite" />
          <h4 className="font-semibold text-graphite text-sm">
            Operaciones: {topicLabel}
          </h4>
        </div>

        {showSummary && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 bg-chalk border border-silver-mist/60 rounded-lg px-3 py-2.5">
            <div>
              <span className="text-xs text-slate block">Saldo actual</span>
              <span className={`text-sm font-medium ${(summary.current_balance ?? 0) >= 0 ? "text-sage" : "text-terracotta"}`}>
                ${(summary.current_balance ?? 0).toLocaleString("es-CL")}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate block">Transacciones</span>
              <span className="text-sm font-medium text-ink">{summary.transaction_count ?? 0}</span>
            </div>
            <div>
              <span className="text-xs text-slate block">Ingresos del periodo</span>
              <span className="text-sm font-medium text-sage">${(summary.monthly_income ?? 0).toLocaleString("es-CL")}</span>
            </div>
            <div>
              <span className="text-xs text-slate block">Egresos del periodo</span>
              <span className="text-sm font-medium text-terracotta">${(summary.monthly_expenses ?? 0).toLocaleString("es-CL")}</span>
            </div>
          </div>
        )}

        {showTransactions && filteredTransactions.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-slate font-medium mb-1">Últimos movimientos</p>
            <div className="space-y-1">
              {filteredTransactions.map((t, i) => (
                <div key={i} className="flex items-center justify-between bg-chalk border border-silver-mist/60 rounded px-2.5 py-1.5">
                  <div className="min-w-0 mr-2">
                    <p className="text-xs text-ink truncate">
                      <span className="text-ash">{t.date}</span>{" "}
                      <span>{t.category}</span>
                    </p>
                    <p className="text-[11px] text-ash truncate">{t.description}</p>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${t.type === "income" ? "text-sage" : "text-terracotta"}`}>
                    {t.type === "income" ? "+" : "-"}${t.amount.toLocaleString("es-CL")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showCategories && (
          <div className="mb-3">
            <p className="text-xs text-slate font-medium mb-1">Categorías principales</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {summary.top_categories!.slice(0, 5).map((c, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-ink">{c.category}</span>
                  <span className="text-ash">
                    {c.count} trans. ·{" "}
                    <span className={c.total >= 0 ? "text-sage" : "text-terracotta"}>
                      {c.total >= 0 ? "+" : ""}${Math.abs(c.total).toLocaleString("es-CL")}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.insights && data.insights.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-slate font-medium mb-1">Observaciones</p>
            <ul className="space-y-0.5">
              {data.insights.map((insight, i) => (
                <li key={i} className="text-xs text-ink flex items-start gap-1.5">
                  <span className="text-blueprint mt-0.5">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.missing_context && data.missing_context.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-slate font-medium">Datos faltantes</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.missing_context.map((ctx, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-buttercup/40 text-ochre border border-ochre/20">
                  {ctx}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.suggested_categories && data.suggested_categories.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-slate font-medium">Categorías sugeridas</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.suggested_categories.map((cat, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-mauve/10 text-mauve border border-mauve/20">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.next_steps && data.next_steps.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-slate font-medium">Próximos pasos</p>
            <ol className="mt-1 space-y-0.5 list-decimal list-inside text-xs text-ink">
              {data.next_steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {showDisclaimer && (
          <div className="flex items-start gap-2 bg-buttercup/20 border border-ochre/10 rounded-lg px-3 py-2">
            <span className="text-[11px] text-ochre">
              Incluye movimientos confirmados, pendientes e inferidos. Reporte educativo, no es cálculo tributario ni conciliación bancaria.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export type { OperationsCardData, TransactionItem, CategorySummary };
