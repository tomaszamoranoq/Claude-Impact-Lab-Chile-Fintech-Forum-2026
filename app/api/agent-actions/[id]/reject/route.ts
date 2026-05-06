import { NextResponse } from "next/server";
import { rejectAgentAction } from "@/lib/server/store";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const action = await rejectAgentAction(id);
    return NextResponse.json({ success: true, data: action });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
