import { NextResponse } from "next/server";
import { getLatestBusinessDiagnosis } from "@/lib/server/business-diagnoses";

const MOCK_COMPANY_ID = "mock-company-1";

export async function GET() {
  try {
    const diagnosis = await getLatestBusinessDiagnosis(MOCK_COMPANY_ID);
    return NextResponse.json({ success: true, data: diagnosis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
