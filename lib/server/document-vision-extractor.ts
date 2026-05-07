import Anthropic from "@anthropic-ai/sdk";
import { anthropicClient, anthropicModel } from "@/lib/server/anthropic";
import { Document, DocumentExtraction, documentExtractionSchema } from "@/lib/schemas";
import { downloadDocumentFile } from "@/lib/server/storage";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

type SupportedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

const VISION_TOOL: Anthropic.Tool = {
  name: "emit_document_extraction",
  description:
    "Devuelve los campos extraídos de un documento chileno (factura, boleta, contrato, certificado tributario, etc.). " +
    "Todos los montos en CLP. Si no se detecta un campo, omítelo o usa null. " +
    "Sé conservador: solo reporta datos visibles en el documento.",
  input_schema: {
    type: "object",
    properties: {
      document_kind: {
        type: "string",
        enum: ["invoice", "receipt", "contract", "tax_certificate", "unknown"],
        description:
          "Tipo de documento detectado. 'invoice'=factura, 'receipt'=boleta, 'contract'=contrato, 'tax_certificate'=certificado tributario, 'unknown'=no se puede determinar.",
      },
      issuer_name: {
        type: "string",
        description: "Nombre del emisor del documento (razón social o persona natural).",
      },
      issuer_rut: {
        type: "string",
        description: "RUT del emisor del documento (formato XX.XXX.XXX-X).",
      },
      document_date: {
        type: "string",
        description: "Fecha del documento en formato YYYY-MM-DD.",
      },
      total_amount: {
        type: "number",
        description: "Monto total del documento en CLP. Solo el valor numérico, sin símbolos.",
      },
      currency: {
        type: "string",
        description: "Moneda del documento. Normalmente 'CLP'.",
        default: "CLP",
      },
      folio: {
        type: "string",
        description: "Número de folio si aparece en el documento.",
      },
      document_number: {
        type: "string",
        description: "Número de documento si aparece y es distinto del folio.",
      },
      suggested_folder: {
        type: "string",
        enum: ["legal", "tributario", "rrhh", "operaciones"],
        description:
          "Carpeta sugerida para archivar: 'legal' para contratos/poderes, 'tributario' para facturas/boletas/certificados SII, 'rrhh' para documentos laborales, 'operaciones' para gastos operativos.",
      },
      suggested_category: {
        type: "string",
        description: "Categoría contable sugerida (ej. 'Materias primas', 'Arriendo', 'Servicios', 'Ventas').",
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description:
          "Nivel de confianza en la extracción (0-1). Usa 0.85+ si los campos son claros, 0.5-0.85 si hay ambigüedad, <0.5 si es muy incierto.",
      },
      warnings: {
        type: "array",
        items: { type: "string" },
        description:
          "Advertencias sobre la extracción: datos poco legibles, campos faltantes, ambigüedades.",
      },
      fields_detected: {
        type: "object",
        description:
          "Mapa de campos detectados y sus valores brutos (ej. { 'folio': '12345', 'form_code': 'F29' }).",
      },
    },
    required: ["document_kind", "confidence", "warnings"],
  },
};

function mapAllowedMimeToAnthropicType(mime: string): SupportedMimeType {
  if (ALLOWED_MIME_TYPES.includes(mime as SupportedMimeType)) {
    return mime as SupportedMimeType;
  }
  throw new Error(`Tipo MIME no soportado para extracción visual: ${mime}`);
}

function isDocumentBlockType(mime: SupportedMimeType): "document" | "image" {
  return mime === "application/pdf" ? "document" : "image";
}

interface AnthropicDocumentBlock {
  type: "document";
  source: {
    type: "base64";
    media_type: "application/pdf";
    data: string;
  };
}

interface AnthropicImageBlock {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/png" | "image/jpeg";
    data: string;
  };
}

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | AnthropicDocumentBlock
  | AnthropicImageBlock;

const SYSTEM_PROMPT = `Eres un extractor de documentos chilenos. Tu tarea es analizar el documento adjunto (PDF o imagen) y extraer información estructurada.

REGLAS:
1. Solo reporta datos que PUEDAS VER en el documento. No inventes nada.
2. Los montos siempre en CLP (pesos chilenos).
3. Si un campo no es visible, no lo incluyas en la respuesta.
4. Para documentos tributarios chilenos (facturas, boletas, certificados), busca:
   - RUT del emisor (formato XX.XXX.XXX-X)
   - Razón social o nombre del emisor
   - Fecha de emisión
   - Monto total (incluyendo IVA si aparece)
   - Número de folio o documento
   - Timbre SII si es factura electrónica
5. Para contratos, extrae nombre de partes y fecha.
6. Para certificados tributarios (F29, F22, etc.), identifica el formulario y período.
7. Sé conservador con el confidence: si el documento es poco claro, baja la confianza.
8. Incluye warnings si hay datos ilegibles, inconsistentes o faltantes.`;

function buildUserContent(
  base64Data: string,
  mimeType: SupportedMimeType,
  fileName: string
): AnthropicContentBlock[] {
  const blockType = isDocumentBlockType(mimeType);

  if (blockType === "document") {
    return [
      {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64Data,
        },
      } as AnthropicDocumentBlock,
      {
        type: "text",
        text: `Analiza este documento chileno y extrae la información estructurada usando la herramienta emit_document_extraction. Nombre del archivo: ${fileName}`,
      },
    ];
  }

  return [
    {
      type: "image",
      source: {
        type: "base64",
        media_type: mimeType,
        data: base64Data,
      },
    } as AnthropicImageBlock,
    {
      type: "text",
      text: `Analiza esta imagen de un documento chileno y extrae la información estructurada usando la herramienta emit_document_extraction. Nombre del archivo: ${fileName}`,
    },
  ];
}

const VALID_DOCUMENT_KINDS: Set<DocumentExtraction["document_kind"]> = new Set([
  "invoice",
  "receipt",
  "contract",
  "tax_certificate",
  "unknown",
]);

const VALID_FOLDERS: Set<NonNullable<DocumentExtraction["suggested_folder"]>> = new Set([
  "legal",
  "tributario",
  "rrhh",
  "operaciones",
]);

function sanitizeDocumentKind(raw: unknown): DocumentExtraction["document_kind"] {
  if (typeof raw === "string" && VALID_DOCUMENT_KINDS.has(raw as DocumentExtraction["document_kind"])) {
    return raw as DocumentExtraction["document_kind"];
  }
  return "unknown";
}

function sanitizeFolder(raw: unknown): DocumentExtraction["suggested_folder"] | undefined {
  if (typeof raw === "string" && VALID_FOLDERS.has(raw as NonNullable<DocumentExtraction["suggested_folder"]>)) {
    return raw as DocumentExtraction["suggested_folder"];
  }
  return undefined;
}

function normalizeExtractionResult(
  raw: Record<string, unknown>,
  _document: Document
): DocumentExtraction {
  const confidence = typeof raw.confidence === "number" ? raw.confidence : 0.5;
  const warnings: string[] = Array.isArray(raw.warnings)
    ? raw.warnings.filter((w): w is string => typeof w === "string")
    : [];

  warnings.push("Extracción automatizada con Claude; requiere revisión humana antes de usar.");

  const fieldsDetected = raw.fields_detected && typeof raw.fields_detected === "object"
    ? { ...(raw.fields_detected as Record<string, unknown>) }
    : {};

  const folio = typeof raw.folio === "string" ? raw.folio : undefined;
  if (folio) {
    fieldsDetected.folio = folio;
  }

  const documentNumber = typeof raw.document_number === "string" ? raw.document_number : undefined;
  if (documentNumber) {
    fieldsDetected.document_number = documentNumber;
  }

  const documentDate = typeof raw.document_date === "string" ? raw.document_date : undefined;
  if (!documentDate) {
    warnings.push("No se detectó fecha visible en el documento.");
  }

  const normalized = {
    mode: "vision" as const,
    document_kind: sanitizeDocumentKind(raw.document_kind),
    issuer_name: typeof raw.issuer_name === "string" ? raw.issuer_name : undefined,
    issuer_rut: typeof raw.issuer_rut === "string" ? raw.issuer_rut : undefined,
    document_date: documentDate,
    total_amount: typeof raw.total_amount === "number" && raw.total_amount > 0
      ? raw.total_amount
      : undefined,
    currency: typeof raw.currency === "string" ? raw.currency : "CLP",
    folio,
    document_number: documentNumber,
    suggested_folder: sanitizeFolder(raw.suggested_folder),
    suggested_category: typeof raw.suggested_category === "string"
      ? raw.suggested_category
      : undefined,
    confidence: Math.max(0, Math.min(1, confidence)),
    warnings,
    fields_detected: fieldsDetected,
  };

  return documentExtractionSchema.parse(normalized);
}

export async function extractDocumentVision(
  document: Document
): Promise<DocumentExtraction> {
  if (!anthropicClient) {
    throw new Error("ANTHROPIC_API_KEY no configurada. No se puede usar extracción visual.");
  }

  if (!document.storage_bucket || !document.storage_path) {
    throw new Error(
      "El documento no tiene storage_bucket o storage_path. No se puede descargar el archivo."
    );
  }

  if (!document.mime_type) {
    throw new Error(
      "El documento no tiene mime_type registrado. No se puede determinar cómo procesarlo."
    );
  }

  const mimeType = mapAllowedMimeToAnthropicType(document.mime_type);

  const { data: fileBuffer } = await downloadDocumentFile(
    document.storage_bucket,
    document.storage_path
  );

  const base64Data = fileBuffer.toString("base64");
  const userContent = buildUserContent(base64Data, mimeType, document.name);

  const response = await anthropicClient.messages.create({
    model: anthropicModel,
    max_tokens: 1024,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userContent as Anthropic.MessageParam["content"],
      },
    ],
    tools: [VISION_TOOL],
    tool_choice: { type: "tool", name: "emit_document_extraction" },
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude no devolvió la herramienta esperada emit_document_extraction.");
  }

  const raw = toolUse.input as Record<string, unknown>;
  return normalizeExtractionResult(raw, document);
}

export function isRealExtractionAvailable(): boolean {
  return anthropicClient !== null;
}
