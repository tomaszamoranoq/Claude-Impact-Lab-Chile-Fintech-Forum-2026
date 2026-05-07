import { NextRequest, NextResponse } from "next/server";
import { createBusinessDiagnosis } from "@/lib/server/business-diagnoses";
import { createBusinessDiagnosisInputSchema } from "@/lib/schemas";
import { getDemoIdentityWithCompany } from "@/lib/server/demo-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createBusinessDiagnosisInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.format() },
        { status: 400 }
      );
    }

    const { companyId, userId } = await getDemoIdentityWithCompany();
    const diagnosis = await createBusinessDiagnosis({
      ...parsed.data,
      company_id: companyId,
      user_id: userId,
    });

    return NextResponse.json(
      { success: true, data: diagnosis },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
