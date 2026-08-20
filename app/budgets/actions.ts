"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { shiftPeriod } from "@/lib/period";

export type BudgetState = { error: string | null; success: boolean };

const PERIOD_RE = /^\d{4}-\d{2}$/;

export async function setBudget(
  _prevState: BudgetState,
  formData: FormData,
): Promise<BudgetState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", success: false };

  const categoryId = String(formData.get("category_id") ?? "");
  if (!categoryId) return { error: "Missing category.", success: false };

  const period = String(formData.get("period") ?? "");
  if (!PERIOD_RE.test(period)) {
    return { error: "Invalid period.", success: false };
  }

  const raw = String(formData.get("amount") ?? "").trim();

  if (raw === "") {
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("user_id", user.id)
      .eq("category_id", categoryId)
      .eq("period", period);

    if (error) return { error: error.message, success: false };

    revalidatePath("/budgets");
    return { error: null, success: true };
  }

  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Limit must be greater than 0.", success: false };
  }

  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: user.id,
      category_id: categoryId,
      period,
      amount,
    },
    { onConflict: "user_id,category_id,period" },
  );

  if (error) return { error: error.message, success: false };

  revalidatePath("/budgets");
  return { error: null, success: true };
}

export async function copyPreviousBudgets(formData: FormData): Promise<void> {
  const period = String(formData.get("period") ?? "");
  if (!PERIOD_RE.test(period)) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const previous = shiftPeriod(period, -1);

  const { data: rows, error } = await supabase
    .from("budgets")
    .select("category_id, amount")
    .eq("user_id", user.id)
    .eq("period", previous);

  if (error) {
    console.error("Copy budgets failed (read):", error);
    return;
  }
  if (!rows || rows.length === 0) {
    console.warn("No budgets to copy from", previous);
    return;
  }

  const { error: writeError } = await supabase.from("budgets").upsert(
    rows.map((r) => ({
      user_id: user.id,
      category_id: r.category_id,
      period,
      amount: r.amount,
    })),
    { onConflict: "user_id,category_id,period" },
  );

  if (writeError) console.error("Copy budgets failed (write):", writeError);

  revalidatePath("/budgets");
}
