import { NextResponse } from "next/server";
import { getDocument, updateDocumentStatus } from "@/lib/server/documents";
import { extractDocumentMock } from "@/lib/server/document-extractor";

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

    const extraction = extractDocumentMock(existing);

    const updated = await updateDocumentStatus(id, "analyzed", extraction as Record<string, unknown>);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
