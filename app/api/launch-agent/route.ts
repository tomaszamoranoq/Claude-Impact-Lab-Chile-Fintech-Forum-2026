import { NextRequest, NextResponse } from "next/server";
import { LaunchAgent } from "@/lib/server/agents/launch-agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const inputText = body.input_text;

    if (!inputText || typeof inputText !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "El campo 'input_text' es obligatorio.",
          warnings: [],
          model_used: "invalid-request",
        },
        { status: 400 }
      );
    }

    const agent = new LaunchAgent();
    const result = await agent.run({
      inputText,
      companyId: "mock-company-1",
      userId: "mock-user-1",
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Error desconocido",
          warnings: result.warnings,
          model_used: result.model_used || "unknown",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        warnings: result.warnings,
        model_used: result.model_used,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: message,
        warnings: [],
        model_used: "unknown",
      },
      { status: 500 }
    );
  }
}
