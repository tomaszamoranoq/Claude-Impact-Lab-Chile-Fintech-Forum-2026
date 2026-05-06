import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/server/documents";

export async function GET() {
  try {
    const documents = await listDocuments();
    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
