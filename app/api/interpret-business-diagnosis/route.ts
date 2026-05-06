import { NextRequest, NextResponse } from "next/server";
import { interpretBusinessDiagnosis } from "@/lib/server/business-diagnosis-interpreter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const inputText = body.input_text;

    if (typeof inputText !== "string" || inputText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "input_text is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const result = await interpretBusinessDiagnosis(inputText.trim());

    return NextResponse.json({
      success: true,
      is_business_diagnosis: result.isBusinessDiagnosis,
      message: result.message,
      data: result.diagnosis ?? null,
      model_used: result.model_used,
      interpreter: result.interpreter,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
