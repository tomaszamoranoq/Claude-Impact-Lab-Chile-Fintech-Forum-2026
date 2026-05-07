import { NextResponse } from "next/server";
import { getLatestRoadmapItemsByDiagnosis } from "@/lib/server/roadmap-items";

export async function GET() {
  try {
    const items = await getLatestRoadmapItemsByDiagnosis("mock-company-1");
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
