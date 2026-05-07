import { NextResponse } from "next/server";
import { getLatestBusinessDiagnosis } from "@/lib/server/business-diagnoses";
import { getDemoIdentityWithCompany } from "@/lib/server/demo-session";

export async function GET() {
  try {
    const { companyId } = await getDemoIdentityWithCompany();
    const diagnosis = await getLatestBusinessDiagnosis(companyId);
    return NextResponse.json({ success: true, data: diagnosis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
