import { NextResponse } from "next/server";
import { listCashTransactions } from "@/lib/server/store";
import { getDemoIdentityWithCompany } from "@/lib/server/demo-session";

export async function GET() {
  try {
    const { companyId } = await getDemoIdentityWithCompany();
    const transactions = await listCashTransactions(companyId);
    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
