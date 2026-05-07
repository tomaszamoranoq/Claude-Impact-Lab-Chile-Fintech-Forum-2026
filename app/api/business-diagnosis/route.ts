import { NextRequest, NextResponse } from "next/server";
import { createBusinessDiagnosis } from "@/lib/server/business-diagnoses";
import {
  createBusinessDiagnosisInputSchema,
  launchAgentRoadmapItemSchema,
} from "@/lib/schemas";
import { getDemoIdentityWithCompany } from "@/lib/server/demo-session";
import { createRoadmapItems } from "@/lib/server/roadmap-items";
import { confirmAgentAction, createAgentAction } from "@/lib/server/store";
import { z } from "zod";

const saveDiagnosisInputSchema = createBusinessDiagnosisInputSchema.extend({
  roadmap_items: z.array(launchAgentRoadmapItemSchema).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = saveDiagnosisInputSchema.safeParse(body);

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
    const roadmapItems = parsed.data.roadmap_items
      ? await createRoadmapItems(parsed.data.roadmap_items, companyId, diagnosis.id)
      : [];
    let action = null;

    if (parsed.data.recommended_legal_type !== "unknown") {
      const proposedAction = await createAgentAction({
        company_id: companyId,
        user_id: userId,
        intent: "create_company_constitution",
        input_text: `Diagnóstico aprobado: ${parsed.data.input_text}`,
        proposed_payload: {
          legal_type: parsed.data.recommended_legal_type,
          description: `Constituir empresa como ${parsed.data.recommended_legal_type}`,
          date: new Date().toISOString().slice(0, 10),
        },
        confidence: parsed.data.confidence,
        missing_fields: [],
        model_used: parsed.data.model_used,
        sources_used: ["launch-agent"],
      });
      action = (await confirmAgentAction(proposedAction.id, companyId)).action;
    }

    return NextResponse.json(
      { success: true, data: { diagnosis, roadmap_items: roadmapItems, action } },
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
