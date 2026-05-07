import { NextRequest, NextResponse } from "next/server";
import {
  createAgentAction,
  listAgentActions,
} from "@/lib/server/store";
import { createAgentActionInputSchema } from "@/lib/schemas";
import { getDemoIdentityWithCompany } from "@/lib/server/demo-session";

export async function GET() {
  try {
    const { companyId } = await getDemoIdentityWithCompany();
    const actions = await listAgentActions(companyId);
    return NextResponse.json({ success: true, data: actions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createAgentActionInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.format() },
        { status: 400 }
      );
    }

    const { companyId, userId } = await getDemoIdentityWithCompany();
    const action = await createAgentAction({
      ...parsed.data,
      company_id: companyId,
      user_id: userId,
    });
    return NextResponse.json({ success: true, data: action }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
