import { NextResponse } from "next/server";
import { getDocument, updateDocumentStatus } from "@/lib/server/documents";
import { extractDocumentMock } from "@/lib/server/document-extractor";
import {
  extractDocumentVision,
  isRealExtractionAvailable,
} from "@/lib/server/document-vision-extractor";
import { Document, DocumentExtraction } from "@/lib/schemas";

const ALLOWED_VISION_MIMES = ["application/pdf", "image/png", "image/jpeg"];

function buildMockFallback(
  existing: Document,
  warning: string
): DocumentExtraction {
  const mock = extractDocumentMock(existing);
  return {
    ...mock,
    warnings: [
      ...mock.warnings.filter(
        (w) => w !== "Extracción simulada; requiere revisión humana."
      ),
      warning,
    ],
  };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getDocument(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Documento no encontrado." },
        { status: 404 }
      );
    }

    let extraction: DocumentExtraction;

    if (!isRealExtractionAvailable()) {
      extraction = buildMockFallback(
        existing,
        "ANTHROPIC_API_KEY no configurada; se usó extracción mock."
      );
    } else if (!existing.storage_path) {
      extraction = buildMockFallback(
        existing,
        "Documento sin archivo en Storage; se usó extracción mock."
      );
    } else if (
      !existing.mime_type ||
      !ALLOWED_VISION_MIMES.includes(existing.mime_type)
    ) {
      extraction = buildMockFallback(
        existing,
        "Tipo MIME no soportado para extracción visual; se usó extracción mock."
      );
    } else {
      try {
        extraction = await extractDocumentVision(existing);
      } catch (visionError) {
        const message =
          visionError instanceof Error ? visionError.message : "Error desconocido";
        console.warn("Vision extraction failed, falling back to mock:", message);
        extraction = buildMockFallback(
          existing,
          `Extracción visual falló (${message}); se usó extracción mock.`
        );
      }
    }

    const updated = await updateDocumentStatus(
      id,
      "analyzed",
      extraction as Record<string, unknown>
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
