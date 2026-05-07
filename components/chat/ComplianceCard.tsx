"use client";

import { FileText, AlertTriangle } from "lucide-react";

const TOPIC_LABELS: Record<string, string> = {
  f29: "F29 / IVA mensual",
  f22: "F22 / Renta anual",
  iva: "IVA",
  municipal_patent: "Patente municipal",
  previred: "Previred",
  tax_start: "Inicio de actividades",
  general: "Cumplimiento general",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  conditional: "Condicional",
  informational: "Informativo",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-ochre/10 text-ochre border-ochre/20",
  conditional: "bg-mauve/10 text-mauve border-mauve/20",
  informational: "bg-slate/10 text-slate border-slate/20",
};

interface ObligationItem {
  title: string;
  description: string;
  institution: string;
  form_code?: string;
  frequency?: string;
  due_hint?: string;
  applies_if?: string;
  status_hint: "pending" | "conditional" | "informational";
}

interface ComplianceCardData {
  topic: string;
  obligations: ObligationItem[];
  missing_context?: string[];
  next_steps?: string[];
  sources?: Array<{ name: string }>;
  warnings?: string[];
}

interface Props {
  data: ComplianceCardData;
}

export default function ComplianceCard({ data }: Props) {
  const topicLabel = TOPIC_LABELS[data.topic] || data.topic || "Cumplimiento";
  const obligations = data.obligations || [];
  const visibleObligations = obligations.slice(0, 4);
  const extraCount = obligations.length - 4;

  return (
    <div className="mt-4 bg-vellum border border-silver-mist rounded-xl overflow-hidden">
      <div className="border-l-4 border-blueprint px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={14} className="text-blueprint" />
          <h4 className="font-semibold text-graphite text-sm">
            Cumplimiento: {topicLabel}
          </h4>
        </div>

        {obligations.length > 0 && (
          <div className="space-y-3">
            {visibleObligations.map((obl, i) => (
              <div
                key={i}
                className="bg-chalk border border-silver-mist/60 rounded-lg px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{obl.title}</p>
                    <p className="text-xs text-slate mt-0.5">
                      {obl.institution}
                      {obl.form_code ? ` · ${obl.form_code}` : ""}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${STATUS_STYLES[obl.status_hint] || STATUS_STYLES.informational}`}
                  >
                    {STATUS_LABELS[obl.status_hint] || obl.status_hint}
                  </span>
                </div>

                {(obl.frequency || obl.due_hint) && (
                  <p className="text-xs text-ash mt-1.5">
                    {obl.frequency && <span>{obl.frequency}</span>}
                    {obl.frequency && obl.due_hint && <span> — </span>}
                    {obl.due_hint && <span>{obl.due_hint}</span>}
                  </p>
                )}

                {obl.applies_if && (
                  <div className="mt-1.5 bg-buttercup/20 border border-ochre/10 rounded px-2 py-1">
                    <p className="text-[11px] text-ochre italic">{obl.applies_if}</p>
                  </div>
                )}
              </div>
            ))}

            {extraCount > 0 && (
              <p className="text-xs text-slate pl-1">
                +{extraCount} obligaciones adicionales
              </p>
            )}
          </div>
        )}

        {data.missing_context && data.missing_context.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-slate font-medium">Datos por confirmar</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.missing_context.map((ctx, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-buttercup/40 text-ochre border border-ochre/20">
                  {ctx}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.next_steps && data.next_steps.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-slate font-medium">Próximos pasos</p>
            <ol className="mt-1 space-y-0.5 list-decimal list-inside text-xs text-ink">
              {data.next_steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {data.sources && data.sources.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ash">
            <span className="font-medium text-slate">Fuentes base:</span>
            <span>{data.sources.map((s) => s.name).join(", ")}</span>
          </div>
        )}

        <div className="mt-3 flex items-start gap-2 bg-buttercup/20 border border-ochre/10 rounded-lg px-3 py-2">
          <AlertTriangle size={12} className="text-ochre mt-0.5 shrink-0" />
          <p className="text-[11px] text-ochre">
            Verifica fechas y requisitos en portales oficiales. Esta información es educativa y no reemplaza a un contador.
          </p>
        </div>
      </div>
    </div>
  );
}

export type { ComplianceCardData, ObligationItem };
