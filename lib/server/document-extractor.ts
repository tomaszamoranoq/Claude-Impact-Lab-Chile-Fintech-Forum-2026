import { Document, DocumentExtraction, DocumentFolder } from "@/lib/schemas";

const FALLBACK_DATE = "2026-05-06";

function normalizeName(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function deterministicAmountFromName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0x7fffffff;
  }
  const base = 45000 + (hash % 205000);
  return Math.round(base / 1000) * 1000;
}

function classifyDocument(document: Document): DocumentExtraction["document_kind"] {
  const name = normalizeName(document.name);
  const folder = document.folder;

  if (name.includes("certificado") || name.includes("f29") || name.includes("sii")) {
    return "tax_certificate";
  }

  if (name.includes("boleta")) {
    return "receipt";
  }

  if (name.includes("factura")) {
    return "invoice";
  }

  if (name.includes("contrato") || folder === "legal" || folder === "rrhh") {
    return "contract";
  }

  if (folder === "tributario" && document.file_type === "PDF") {
    return "invoice";
  }

  return "unknown";
}

function buildExtraction(kind: DocumentExtraction["document_kind"], document: Document): DocumentExtraction {
  const name = normalizeName(document.name);
  const date = document.created_at?.slice(0, 10) || FALLBACK_DATE;

  const baseWarnings = ["Extracción simulada; requiere revisión humana."];

  switch (kind) {
    case "tax_certificate": {
      return {
        mode: "mock",
        document_kind: "tax_certificate",
        issuer_name: "Servicio de Impuestos Internos",
        document_date: date,
        currency: "CLP",
        suggested_folder: "tributario",
        confidence: 0.82,
        warnings: baseWarnings,
        fields_detected: { form_code: "F29" },
      };
    }

    case "receipt": {
      const amount = name.includes("cafe") || name.includes("café")
        ? 4500
        : name.includes("pan")
          ? 3200
          : 25000;

      return {
        mode: "mock",
        document_kind: "receipt",
        issuer_name: "Panadería La Estrella SpA",
        document_date: date,
        total_amount: amount,
        currency: "CLP",
        suggested_folder: "tributario",
        suggested_category: "Ventas",
        confidence: 0.78,
        warnings: baseWarnings,
        fields_detected: {},
      };
    }

    case "invoice": {
      const amount = name.includes("harina")
        ? 120000
        : name.includes("arriendo")
          ? 280000
          : name.includes("servicio") || name.includes("luz") || name.includes("agua")
            ? 45000
            : deterministicAmountFromName(document.name);

      const category = name.includes("harina") || name.includes("materia")
        ? "Materias primas"
        : name.includes("arriendo")
          ? "Arriendo"
          : name.includes("servicio") || name.includes("luz") || name.includes("agua")
            ? "Servicios"
            : "Compra/Venta";

      return {
        mode: "mock",
        document_kind: "invoice",
        issuer_name: "Proveedor Simulado S.A.",
        document_date: date,
        total_amount: amount,
        currency: "CLP",
        suggested_folder: "tributario",
        suggested_category: category,
        confidence: 0.75,
        warnings: baseWarnings,
        fields_detected: {},
      };
    }

    case "contract": {
      const category = document.folder === "rrhh"
        ? "Contrato laboral"
        : "Contrato comercial";

      return {
        mode: "mock",
        document_kind: "contract",
        issuer_name: document.folder === "rrhh" ? "Empleado Simulado" : "Arrendador Simulado",
        document_date: date,
        currency: "CLP",
        suggested_folder: document.folder as DocumentFolder,
        suggested_category: category,
        confidence: 0.72,
        warnings: baseWarnings,
        fields_detected: {},
      };
    }

    case "unknown":
    default: {
      return {
        mode: "mock",
        document_kind: "unknown",
        document_date: date,
        currency: "CLP",
        confidence: 0.3,
        warnings: [
          ...baseWarnings,
          "No se pudo clasificar el documento automáticamente. Requiere revisión humana.",
        ],
        fields_detected: {},
      };
    }
  }
}

export function extractDocumentMock(document: Document): DocumentExtraction {
  const kind = classifyDocument(document);
  return buildExtraction(kind, document);
}
