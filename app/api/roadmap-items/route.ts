import { NextResponse } from "next/server";
import { getLatestRoadmapItemsByDiagnosis } from "@/lib/server/roadmap-items";
import { getDemoIdentityWithCompany } from "@/lib/server/demo-session";

export async function GET() {
  try {
    const { companyId } = await getDemoIdentityWithCompany();
    const items = await getLatestRoadmapItemsByDiagnosis(companyId);
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
