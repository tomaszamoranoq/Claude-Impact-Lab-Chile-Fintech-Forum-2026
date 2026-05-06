import { NextResponse } from "next/server";
import { getDocument, updateDocumentStatus } from "@/lib/server/documents";
import { createAgentAction } from "@/lib/server/store";
import { supabase } from "@/lib/server/supabase";
import { DocumentExtraction } from "@/lib/schemas";

const OPERABLE_KINDS: DocumentExtraction["document_kind"][] = ["invoice", "receipt"];

function isOperable(extraction: DocumentExtraction): boolean {
  return OPERABLE_KINDS.includes(extraction.document_kind) &&
    extraction.total_amount !== undefined &&
    extraction.total_amount > 0;
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

    if (existing.status !== "analyzed") {
      return NextResponse.json(
        { success: false, error: "El documento debe estar analizado antes de confirmar la extracción." },
        { status: 400 }
      );
    }

    const payload = existing.extracted_payload;
    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { success: false, error: "El documento no tiene extracción válida." },
        { status: 400 }
      );
    }

    const extraction = payload as unknown as DocumentExtraction;

    if (!isOperable(extraction)) {
      return NextResponse.json(
        { success: false, error: "Este documento no contiene monto operable para caja." },
        { status: 400 }
      );
    }

    const type = extraction.document_kind === "receipt" ? "income" : "expense";
    const description = extraction.document_kind === "receipt"
      ? `Boleta: ${existing.name}`
      : `Factura: ${existing.name}`;

    const action = await createAgentAction({
      company_id: existing.company_id,
      user_id: "mock-user-1",
      intent: "create_transaction_from_document",
      input_text: `Documento: ${existing.name} — Extracción confirmada desde gestor documental`,
      proposed_payload: {
        type,
        amount: extraction.total_amount!,
        category: extraction.suggested_category || "Otro",
        description,
        date: extraction.document_date || new Date().toISOString().slice(0, 10),
        document_id: existing.id,
        document_name: existing.name,
      },
      confidence: extraction.confidence,
      missing_fields: [],
      model_used: "document-mock-extractor",
      sources_used: ["document-extraction-mock"],
    });

    const updated = await updateDocumentStatus(id, "confirmed", {
      ...extraction,
      confirmed_at: new Date().toISOString(),
    } as Record<string, unknown>);

    const { error: linkError } = await supabase
      .from("documents")
      .update({ linked_agent_action_id: action.id })
      .eq("id", id);

    if (linkError) {
      throw new Error(`Error vinculando acción al documento: ${linkError.message}`);
    }

    return NextResponse.json({ success: true, data: { ...updated, linked_agent_action_id: action.id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
