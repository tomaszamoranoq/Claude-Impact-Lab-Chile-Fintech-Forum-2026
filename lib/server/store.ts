import {
  AgentAction,
  CashTransaction,
  CreateAgentActionInput,
  isFinancialPayload,
} from "@/lib/schemas";
import { supabase } from "./supabase";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function listAgentActions(companyId?: string): Promise<AgentAction[]> {
  let query = supabase
    .from("agent_actions")
    .select("*")
    .order("created_at", { ascending: false });

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list agent actions: ${error.message}`);
  }

  return (data ?? []) as AgentAction[];
}

export async function getAgentAction(
  id: string,
  companyId?: string
): Promise<AgentAction | undefined> {
  let query = supabase
    .from("agent_actions")
    .select("*")
    .eq("id", id);

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") {
      return undefined;
    }
    throw new Error(`Failed to get agent action: ${error.message}`);
  }

  return data as AgentAction;
}

export async function createAgentAction(
  input: CreateAgentActionInput
): Promise<AgentAction> {
  const action: AgentAction = {
    id: generateId("action"),
    company_id: input.company_id,
    user_id: input.user_id,
    intent: input.intent,
    input_text: input.input_text,
    proposed_payload: input.proposed_payload,
    status: "proposed",
    confidence: input.confidence,
    missing_fields: input.missing_fields,
    model_used: input.model_used || "mock-llm",
    sources_used: input.sources_used || [],
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("agent_actions")
    .insert(action)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create agent action: ${error.message}`);
  }

  return data as AgentAction;
}

export async function confirmAgentAction(
  id: string,
  companyId?: string
): Promise<{ action: AgentAction; transaction?: CashTransaction }> {
  const action = await getAgentAction(id, companyId);

  if (!action) {
    throw new Error("Action not found");
  }

  if (action.status !== "proposed") {
    throw new Error(`Action already ${action.status}`);
  }

  const now = new Date().toISOString();

  if (isFinancialPayload(action.proposed_payload)) {
    const updatedAction: AgentAction = {
      ...action,
      status: "executed",
      executed_at: now,
    };

    const { error: updateError } = await supabase
      .from("agent_actions")
      .update({ status: "executed", executed_at: now })
      .eq("id", id);

    if (updateError) {
      throw new Error(
        `Failed to update agent action status: ${updateError.message}`
      );
    }

    const payload = action.proposed_payload;
    const documentReference = isFinancialPayload(payload) && payload.document_name
      ? payload.document_name
      : undefined;

    const transaction: CashTransaction = {
      id: generateId("tx"),
      company_id: action.company_id,
      type: payload.type,
      amount: payload.amount,
      category: payload.category,
      date: payload.date,
      description: payload.description,
      status: "confirmed",
      document_reference: documentReference,
      created_at: now,
    };

    const { data: txData, error: txError } = await supabase
      .from("cash_transactions")
      .insert(transaction)
      .select()
      .single();

    if (txError) {
      throw new Error(
        `Action was marked as executed but failed to create cash transaction: ${txError.message}. ` +
          "This leaves the system in an inconsistent state."
      );
    }

    return { action: updatedAction, transaction: txData as CashTransaction };
  }

  const updatedAction: AgentAction = {
    ...action,
    status: "confirmed",
    executed_at: now,
  };

  const { error: updateError } = await supabase
    .from("agent_actions")
    .update({ status: "confirmed", executed_at: now })
    .eq("id", id);

  if (updateError) {
    throw new Error(
      `Failed to update agent action status: ${updateError.message}`
    );
  }

  return { action: updatedAction };
}

export async function rejectAgentAction(
  id: string,
  companyId?: string
): Promise<AgentAction> {
  const action = await getAgentAction(id, companyId);

  if (!action) {
    throw new Error("Action not found");
  }

  if (action.status !== "proposed") {
    throw new Error(`Action already ${action.status}`);
  }

  const { error } = await supabase
    .from("agent_actions")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to reject agent action: ${error.message}`);
  }

  return { ...action, status: "rejected" };
}

export async function listCashTransactions(companyId?: string): Promise<CashTransaction[]> {
  let query = supabase
    .from("cash_transactions")
    .select("*")
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list cash transactions: ${error.message}`);
  }

  return (data ?? []) as CashTransaction[];
}

export interface CashTransactionSummary {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  transactionCount: number;
  lastTransactions: Array<{
    type: "income" | "expense";
    amount: number;
    category: string;
    description: string;
    date: string;
  }>;
  topCategories: Array<{ category: string; count: number; total: number }>;
}

export async function getCashTransactionSummary(
  companyId: string
): Promise<CashTransactionSummary> {
  const transactions = await listCashTransactions(companyId);

  const sortedByDateDesc = [...transactions].sort((a, b) =>
    b.date.localeCompare(a.date) || String(b.created_at).localeCompare(String(a.created_at))
  );

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  let monthlyIncome = 0;
  let monthlyExpenses = 0;

  if (transactions.length > 0) {
    const recentDate = transactions.reduce((max, t) => (t.date > max ? t.date : max), transactions[0].date);
    const referenceMonth = recentDate.substring(0, 7);

    monthlyIncome = transactions
      .filter((t) => t.type === "income" && t.date.startsWith(referenceMonth))
      .reduce((sum, t) => sum + t.amount, 0);
    monthlyExpenses = transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(referenceMonth))
      .reduce((sum, t) => sum + t.amount, 0);
  }

  const lastTransactions = sortedByDateDesc.slice(0, 5).map((t) => ({
    type: t.type,
    amount: t.amount,
    category: t.category,
    description: t.description,
    date: t.date,
  }));

  const categoryMap = new Map<string, { count: number; total: number }>();
  for (const t of transactions) {
    const entry = categoryMap.get(t.category) || { count: 0, total: 0 };
    entry.count += 1;
    entry.total += t.type === "income" ? t.amount : -t.amount;
    categoryMap.set(t.category, entry);
  }
  const topCategories = Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, count: data.count, total: data.total }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    currentBalance: totalIncome - totalExpenses,
    monthlyIncome,
    monthlyExpenses,
    transactionCount: transactions.length,
    lastTransactions,
    topCategories,
  };
}
