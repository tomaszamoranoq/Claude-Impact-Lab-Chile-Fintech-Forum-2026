"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Document, DocumentFolder, DocumentStatus, DocumentExtraction } from "@/lib/schemas";
import {
  FileText,
  SlidersHorizontal,
  Upload,
  X,
  Sparkles,
  AlertCircle,
  FolderOpen,
  Eye,
  CheckCircle,
} from "lucide-react";

const FOLDERS: { id: DocumentFolder; label: string }[] = [
  { id: "legal", label: "Legal" },
  { id: "tributario", label: "Tributario" },
  { id: "rrhh", label: "RRHH" },
  { id: "operaciones", label: "Operaciones" },
];

const kindLabels: Record<DocumentExtraction["document_kind"], string> = {
  invoice: "Factura",
  receipt: "Boleta",
  contract: "Contrato",
  tax_certificate: "Certificado tributario",
  unknown: "Desconocido",
};

const statusConfig: Record<
  DocumentStatus,
  { label: string; badgeClass: string }
> = {
  uploaded: {
    label: "Subido",
    badgeClass: "bg-ash/10 text-ash border-ash/20",
  },
  pending_analysis: {
    label: "Pendiente de análisis",
    badgeClass: "bg-blossom text-mauve border-mauve/20",
  },
  analyzed: {
    label: "Analizado",
    badgeClass: "bg-blueprint/10 text-blueprint border-blueprint/20",
  },
  confirmed: {
    label: "Confirmado",
    badgeClass: "bg-sage/10 text-sage border-sage/20",
  },
  rejected: {
    label: "Rechazado",
    badgeClass: "bg-graphite/10 text-graphite border-graphite/20",
  },
  failed: {
    label: "Fallido",
    badgeClass: "bg-terracotta/10 text-terracotta border-terracotta/20",
  },
};

function formatDateOnly(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

function tryParseExtraction(payload: unknown): DocumentExtraction | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (p.mode !== "mock" && p.mode !== "vision") return null;
  return {
    mode: p.mode as DocumentExtraction["mode"],
    document_kind: (p.document_kind as DocumentExtraction["document_kind"]) || "unknown",
    issuer_name: p.issuer_name as string | undefined,
    issuer_rut: p.issuer_rut as string | undefined,
    document_date: p.document_date as string | undefined,
    total_amount: p.total_amount as number | undefined,
    currency: (p.currency as string) || "CLP",
    folio: p.folio as string | undefined,
    document_number: p.document_number as string | undefined,
    suggested_folder: p.suggested_folder as DocumentFolder | undefined,
    suggested_category: p.suggested_category as string | undefined,
    confidence: (p.confidence as number) ?? 0,
    warnings: (p.warnings as string[]) || [],
    fields_detected: (p.fields_detected as Record<string, unknown>) || {},
  };
}

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<DocumentFolder>("legal");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFolder, setUploadFolder] = useState<DocumentFolder>("legal");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function fetchDocuments() {
    try {
      setLoading(true);
      const res = await fetch("/api/documents");
      const json = await res.json();
      if (json.success) {
        setDocuments(json.data);
      } else {
        setError(json.error || "Error al cargar documentos");
      }
    } catch {
      setError("Error de red al cargar documentos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of FOLDERS) {
      counts[f.id] = documents.filter((d) => d.folder === f.id).length;
    }
    return counts;
  }, [documents]);

  const filteredDocuments = useMemo(
    () => documents.filter((d) => d.folder === selectedFolder),
    [documents, selectedFolder]
  );

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("folder", uploadFolder);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        setIsModalOpen(false);
        setUploadFile(null);
        await fetchDocuments();
      } else {
        setUploadError(json.error || "Error al subir documento");
      }
    } catch {
      setUploadError("Error de red al subir documento");
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze(id: string) {
    setAnalyzingId(id);
    try {
      const res = await fetch(`/api/documents/${id}/analyze`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? json.data : d))
        );
        setExpandedId(id);
      } else {
        alert(json.error || "Error al analizar documento");
      }
    } catch {
      alert("Error de red al analizar documento");
    } finally {
      setAnalyzingId(null);
    }
  }

  async function handleConfirmExtraction(id: string) {
    setConfirmingId(id);
    try {
      const res = await fetch(`/api/documents/${id}/confirm-extraction`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? json.data : d))
        );
        setExpandedId(null);
      } else {
        alert(json.error || "Error al confirmar extracción");
      }
    } catch {
      alert("Error de red al confirmar extracción");
    } finally {
      setConfirmingId(null);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-graphite">
              Gestor documental de la empresa
            </h1>
            <p className="text-sm text-slate mt-1">
              Total: {documents.length} documento{documents.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setUploadError(null);
              setUploadFile(null);
              setUploadFolder(selectedFolder);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-graphite text-chalk text-sm font-semibold rounded-full hover:bg-ink transition-colors"
          >
            <Upload size={16} />
            Cargar documento
          </button>
        </div>

        {/* Folder cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {FOLDERS.map((f) => (
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
                <FileText size={24} className="text-graphite" />
              </div>
              <div className="text-sm font-semibold text-graphite">{f.label}</div>
              <div className="text-xs text-slate mt-0.5">
                {folderCounts[f.id] ?? 0} docs
              </div>
            </button>
          ))}
        </div>

        {/* Document table */}
        <div className="bg-chalk border border-silver-mist rounded-2xl shadow-card overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-silver-mist/40">
            <h2 className="text-base font-semibold text-graphite">
              {FOLDERS.find((f) => f.id === selectedFolder)?.label}
            </h2>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-chalk border border-silver-mist rounded-full text-xs text-ink hover:bg-vellum transition-colors cursor-default">
              <SlidersHorizontal size={12} />
              Filtrar
            </button>
          </div>

          {loading ? (
            <div className="px-5 py-8 text-sm text-ash">Cargando…</div>
          ) : error ? (
            <div className="px-5 py-8 text-sm text-terracotta">{error}</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="px-5 py-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-linen border border-silver-mist flex items-center justify-center mb-3">
                <FolderOpen size={20} className="text-ash" />
              </div>
              <p className="text-sm text-slate font-medium">
                No hay documentos en esta carpeta
              </p>
              <p className="text-xs text-ash mt-1">
                Sube tu primer documento usando el botón Cargar documento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-silver-mist/60">
                    {["Nombre", "Tipo", "Carpeta", "Fecha", "Estado", "Acción"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-[11px] font-bold text-ash uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => {
                    const cfg = statusConfig[doc.status];
                    const isExpanded = expandedId === doc.id;
                    const extraction = tryParseExtraction(doc.extracted_payload);
                    const canExpand = doc.status === "analyzed" && !!extraction;

                    return (
                      <Fragment key={doc.id}>
                        <tr
                          className={`border-b border-silver-mist/30 hover:bg-vellum/50 transition-colors ${
                            canExpand ? "cursor-pointer" : ""
                          }`}
                          onClick={() => canExpand && toggleExpand(doc.id)}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <FileText size={14} className="text-ash" />
                              <span className="text-sm font-medium text-ink">
                                {doc.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate">
                            {doc.file_type}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate capitalize">
                            {doc.folder}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate whitespace-nowrap">
                            {formatDateOnly(doc.created_at)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center text-[11px] px-2.5 py-1 rounded-full font-semibold border ${cfg.badgeClass}`}
                            >
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {doc.status === "uploaded" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAnalyze(doc.id);
                                }}
                                disabled={analyzingId === doc.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-chalk border border-silver-mist rounded-full text-xs text-ink hover:bg-vellum transition-colors disabled:opacity-50"
                              >
                                <Sparkles size={12} />
                                {analyzingId === doc.id ? "Analizando…" : "Analizar"}
                              </button>
                            )}
                            {doc.status === "analyzed" && extraction && (
                              <>
                                {extraction.total_amount !== undefined && extraction.total_amount > 0 ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleConfirmExtraction(doc.id);
                                    }}
                                    disabled={confirmingId === doc.id}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-graphite text-chalk rounded-full text-xs font-semibold hover:bg-ink transition-colors disabled:opacity-50"
                                  >
                                    <CheckCircle size={12} />
                                    {confirmingId === doc.id ? "Confirmando…" : "Confirmar extracción"}
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-chalk border border-silver-mist rounded-full text-xs text-ash cursor-not-allowed"
                                  >
                                    <CheckCircle size={12} />
                                    No genera acción operativa
                                  </button>
                                )}
                              </>
                            )}
                            {doc.status === "confirmed" && doc.linked_agent_action_id && (
                              <a
                                href="/app/acciones-ia"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-sage/10 text-sage border border-sage/20 rounded-full text-xs font-semibold hover:bg-sage/20 transition-colors"
                              >
                                <Eye size={12} />
                                Ver en Acciones IA
                              </a>
                            )}
                            {canExpand && doc.status !== "confirmed" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(doc.id);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-chalk border border-silver-mist rounded-full text-xs text-ink hover:bg-vellum transition-colors ml-1.5"
                              >
                                <Eye size={12} />
                                {isExpanded ? "Ocultar" : "Ver detalle"}
                              </button>
                            )}
                          </td>
                        </tr>
                        {isExpanded && extraction && (
                          <tr className="bg-vellum/40">
                            <td colSpan={6} className="px-5 py-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-mauve font-semibold">
                                  <Sparkles size={14} />
                                  {extraction.mode === "vision"
                                    ? "Extracción desde archivo con Claude. Revisa antes de confirmar."
                                    : "Extracción simulada. Revisa los datos antes de usarlos."}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                  <div className="bg-chalk border border-silver-mist rounded-xl px-3 py-2">
                                    <div className="text-[11px] font-bold text-ash uppercase tracking-wider">
                                      Tipo detectado
                                    </div>
                                    <div className="mt-0.5 text-ink">
                                      {kindLabels[extraction.document_kind]}
                                    </div>
                                  </div>

                                  <div className="bg-chalk border border-silver-mist rounded-xl px-3 py-2">
                                    <div className="text-[11px] font-bold text-ash uppercase tracking-wider">
                                      Emisor
                                    </div>
                                    <div className="mt-0.5 text-ink">
                                      {extraction.issuer_name || "—"}
                                    </div>
                                  </div>

                                  <div className="bg-chalk border border-silver-mist rounded-xl px-3 py-2">
                                    <div className="text-[11px] font-bold text-ash uppercase tracking-wider">
                                      RUT emisor
                                    </div>
                                    <div className="mt-0.5 text-ink">
                                      {extraction.issuer_rut || "—"}
                                    </div>
                                  </div>

                                  <div className="bg-chalk border border-silver-mist rounded-xl px-3 py-2">
                                    <div className="text-[11px] font-bold text-ash uppercase tracking-wider">
                                      Fecha detectada
                                    </div>
                                    <div className="mt-0.5 text-ink">
                                      {extraction.document_date
                                        ? formatDateOnly(extraction.document_date)
                                        : "—"}
                                    </div>
                                  </div>

                                  <div className="bg-chalk border border-silver-mist rounded-xl px-3 py-2">
                                    <div className="text-[11px] font-bold text-ash uppercase tracking-wider">
                                      Folio / N° documento
                                    </div>
                                    <div className="mt-0.5 text-ink">
                                      {extraction.folio || extraction.document_number || "—"}
                                    </div>
                                  </div>

                                  <div className="bg-chalk border border-silver-mist rounded-xl px-3 py-2">
                                    <div className="text-[11px] font-bold text-ash uppercase tracking-wider">
                                      Monto detectado
                                    </div>
                                    <div className="mt-0.5 text-ink">
                                      {extraction.total_amount !== undefined
                                        ? `$${extraction.total_amount.toLocaleString("es-CL")} ${extraction.currency}`
                                        : "—"}
                                    </div>
                                  </div>

                                  <div className="bg-chalk border border-silver-mist rounded-xl px-3 py-2">
                                    <div className="text-[11px] font-bold text-ash uppercase tracking-wider">
                                      Categoría sugerida
                                    </div>
                                    <div className="mt-0.5 text-ink">
                                      {extraction.suggested_category || "—"}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-ash">
                                  <span>
                                    <span className="font-semibold text-slate">Confianza:</span>{" "}
                                    {(extraction.confidence * 100).toFixed(0)}%
                                  </span>
                                  {extraction.suggested_folder && (
                                    <span>
                                      <span className="font-semibold text-slate">Carpeta sugerida:</span>{" "}
                                      {extraction.suggested_folder}
                                    </span>
                                  )}
                                </div>

                                {extraction.warnings.length > 0 && (
                                  <div className="bg-terracotta/5 border border-terracotta/15 rounded-xl px-3 py-2 space-y-1">
                                    <div className="text-[11px] font-bold text-terracotta uppercase tracking-wider">
                                      Advertencias
                                    </div>
                                    <ul className="list-disc list-inside text-xs text-terracotta space-y-0.5">
                                      {extraction.warnings.map((w, i) => (
                                        <li key={i}>{w}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <div className="flex items-center gap-3 pt-1">
                                  {extraction.total_amount !== undefined && extraction.total_amount > 0 ? (
                                    <>
                                      <button
                                        onClick={() => handleConfirmExtraction(doc.id)}
                                        disabled={confirmingId === doc.id}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-graphite text-chalk text-xs font-semibold rounded-full hover:bg-ink transition-colors disabled:opacity-50"
                                      >
                                        <CheckCircle size={14} />
                                        {confirmingId === doc.id ? "Confirmando…" : "Confirmar extracción"}
                                      </button>
                                      <span className="text-[11px] text-ash">
                                        Se creará una acción propuesta en Acciones IA
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        disabled
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-chalk border border-silver-mist text-ash text-xs font-semibold rounded-full cursor-not-allowed"
                                      >
                                        <CheckCircle size={14} />
                                        No genera acción operativa
                                      </button>
                                      <span className="text-[11px] text-ash">
                                        Este documento no contiene monto operable para caja.
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-5 py-3 text-xs text-ash border-t border-silver-mist/30">
            Mostrando {filteredDocuments.length} de {filteredDocuments.length}{" "}
            documentos
          </div>
        </div>

        {/* Info card */}
        <div className="bg-chalk border border-silver-mist rounded-2xl p-5 shadow-card border-l-4 border-l-mauve flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blossom flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-mauve" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-graphite">
              Análisis de documentos con Claude Vision
            </h3>
            <p className="text-sm text-slate mt-1 leading-relaxed">
              Los PDFs e imágenes se analizan con Claude Vision para extraer
              datos estructurados. Si la clave API no está configurada, se usa
              una extracción simulada de respaldo. Toda extracción requiere
              revisión y confirmación humana antes de generar acciones.
            </p>
          </div>
        </div>
      </div>

      {/* Upload modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/40 backdrop-blur-sm">
          <div className="bg-chalk border border-silver-mist rounded-2xl shadow-card w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-silver-mist/40">
              <h3 className="text-base font-semibold text-graphite">
                Cargar documento
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-ash hover:text-graphite transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ash uppercase tracking-wider mb-1.5">
                  Archivo
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-ink file:mr-3 file:px-3 file:py-1.5 file:rounded-full file:border-0 file:bg-graphite file:text-chalk file:text-xs file:font-semibold hover:file:bg-ink"
                  required
                />
                <p className="text-[11px] text-ash mt-1.5">
                  Máximo 5 MB. Formatos: PDF, PNG, JPEG.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ash uppercase tracking-wider mb-1.5">
                  Carpeta
                </label>
                <select
                  value={uploadFolder}
                  onChange={(e) =>
                    setUploadFolder(e.target.value as DocumentFolder)
                  }
                  className="w-full px-3 py-2 bg-chalk border border-silver-mist rounded-xl text-sm text-ink focus:outline-none focus:border-graphite"
                >
                  {FOLDERS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {uploadError && (
                <div className="flex items-start gap-2 text-sm text-terracotta bg-terracotta/10 border border-terracotta/20 rounded-xl px-3 py-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-ink hover:bg-vellum rounded-full transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="px-4 py-2 bg-graphite text-chalk text-sm font-semibold rounded-full hover:bg-ink transition-colors disabled:opacity-50"
                >
                  {uploading ? "Subiendo…" : "Subir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
