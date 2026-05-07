import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/server/documents";
import { getDemoIdentityWithCompany } from "@/lib/server/demo-session";

export async function GET() {
  try {
    const { companyId } = await getDemoIdentityWithCompany();
    const documents = await listDocuments(companyId);
    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
