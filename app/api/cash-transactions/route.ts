import { NextResponse } from "next/server";
import { listCashTransactions } from "@/lib/server/store";

export async function GET() {
  try {
    const transactions = await listCashTransactions();
    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
