"use client";

import { useState } from "react";
import { mockFolders } from "@/lib/mock-data";
import { FileText, SlidersHorizontal, Sparkles } from "lucide-react";

const statusConfig: Record<string, { label: string; badgeClass: string }> = {
  extracted: { label: "Datos extraídos", badgeClass: "bg-blueprint/10 text-blueprint border-blueprint/20" },
  reviewed: { label: "Revisado", badgeClass: "bg-sage/10 text-sage border-sage/20" },
  uploaded: { label: "Subido", badgeClass: "bg-ash/10 text-ash border-ash/20" },
};

const folderIcons = [
  <FileText key="legal" size={24} className="text-graphite" />,
  <FileText key="trib" size={24} className="text-graphite" />,
  <FileText key="rrhh" size={24} className="text-graphite" />,
  <FileText key="ops" size={24} className="text-graphite" />,
];

export default function DocumentosPage() {
  const [selectedFolder, setSelectedFolder] = useState(mockFolders[0].id);
  const folder = mockFolders.find((f) => f.id === selectedFolder);
  const totalDocs = mockFolders.reduce((sum, f) => sum + f.documents.length, 0);

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-graphite">Gestor documental de la empresa</h1>
          <p className="text-sm text-slate mt-1">Total: {totalDocs} documentos</p>
        </div>

        {/* Folder cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {mockFolders.map((f, idx) => (
            <button
              key={f.id}
              onClick={() => setSelectedFolder(f.id)}
              className={`text-left p-5 rounded-2xl border transition-all ${
                selectedFolder === f.id
                  ? "bg-chalk border-graphite shadow-card"
                  : "bg-chalk border-silver-mist hover:border-graphite/40 hover:shadow-card"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-linen border border-silver-mist flex items-center justify-center mb-3">
                {folderIcons[idx] || <FileText size={24} className="text-graphite" />}
              </div>
              <div className="text-sm font-semibold text-graphite">{f.name}</div>
              <div className="text-xs text-slate mt-0.5">{f.documents.length} docs</div>
            </button>
          ))}
        </div>

        {/* Document table */}
        {folder && (
          <div className="bg-chalk border border-silver-mist rounded-2xl shadow-card overflow-hidden mb-6">
            <div className="flex items-center justify-between px-5 py-4 border-b border-silver-mist/40">
              <h2 className="text-base font-semibold text-graphite">{folder.name}</h2>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-chalk border border-silver-mist rounded-full text-xs text-ink hover:bg-vellum transition-colors cursor-default">
                <SlidersHorizontal size={12} />
                Filtrar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-silver-mist/60">
                    {["Nombre", "Tipo", "Fecha", "Estado"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-ash uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {folder.documents.map((doc) => {
                    const cfg = statusConfig[doc.status] || statusConfig.uploaded;
                    return (
                      <tr key={doc.id} className="border-b border-silver-mist/30 hover:bg-vellum/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-ash" />
                            <span className="text-sm font-medium text-ink">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate">{doc.type}</td>
                        <td className="px-5 py-3.5 text-sm text-slate">{doc.uploaded_at}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center text-[11px] px-2.5 py-1 rounded-full font-semibold border ${cfg.badgeClass}`}>
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 text-xs text-ash border-t border-silver-mist/30">
              Mostrando {folder.documents.length} de {folder.documents.length} documentos
            </div>
          </div>
        )}

        {/* AI suggestion */}
        <div className="bg-chalk border border-silver-mist rounded-2xl p-5 shadow-card border-l-4 border-l-mauve flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blossom flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-mauve" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-graphite">Revisión de Documento Pendiente</h3>
            <p className="text-sm text-slate mt-1 leading-relaxed">
              Se ha detectado que el documento &ldquo;Poder de Representación General&rdquo; podría requerir actualización.
              ¿Deseas que el agente revise el estado?
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button className="px-4 py-2 bg-graphite text-chalk text-xs font-semibold rounded-full hover:bg-ink transition-colors cursor-default">
                Generar borrador
              </button>
              <button className="px-4 py-2 bg-chalk text-ink border border-silver-mist text-xs font-semibold rounded-full hover:bg-vellum transition-colors cursor-default">
                Ignorar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
