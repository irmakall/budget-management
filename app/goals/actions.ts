"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CURRENCIES } from "@/lib/currencies";

export type GoalState = { error: string | null; success: boolean };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NAME = 60;

export async function createGoal(
  _prevState: GoalState,
  formData: FormData,
): Promise<GoalState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", success: false };

  const name = String(formData.get("name") ?? "").trim();
  if (name.length === 0) return { error: "Name is required.", success: false };
  if (name.length > MAX_NAME) {
    return {
      error: `Name must be at most ${MAX_NAME} characters.`,
      success: false,
    };
  }

  const currency = String(formData.get("currency") ?? "");
  if (!(CURRENCIES as readonly string[]).includes(currency)) {
    return { error: "Select a valid currency.", success: false };
  }

  const targetAmount = Number(formData.get("target_amount"));
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    return { error: "Target must be greater than 0.", success: false };
  }

  const startAmount = Number(formData.get("current_amount") ?? 0);
  if (!Number.isFinite(startAmount) || startAmount < 0) {
    return { error: "Starting amount cannot be negative.", success: false };
  }

  const rawDate = String(formData.get("target_date") ?? "").trim();
  if (rawDate !== "" && !DATE_RE.test(rawDate)) {
    return { error: "Invalid target date.", success: false };
  }

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    name,
    currency,
    target_amount: targetAmount,
    current_amount: startAmount,
    target_date: rawDate === "" ? null : rawDate,
  });

  if (error) return { error: error.message, success: false };

  revalidatePath("/goals");
  return { error: null, success: true };
}

export async function contributeToGoal(
  _prevState: GoalState,
  formData: FormData,
): Promise<GoalState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", success: false };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing goal id.", success: false };

  const delta = Number(formData.get("delta"));
  if (!Number.isFinite(delta) || delta === 0) {
    return { error: "Enter an amount.", success: false };
  }

  const { data: goal, error: readError } = await supabase
    .from("goals")
    .select("current_amount")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (readError || !goal) return { error: "Goal not found.", success: false };

  const next = Math.round((Number(goal.current_amount) + delta) * 100) / 100;
  if (next < 0) {
    return { error: "You cannot go below zero.", success: false };
  }

  const { data, error } = await supabase
    .from("goals")
    .update({ current_amount: next })
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return { error: error.message, success: false };
  if (!data || data.length === 0) {
    return { error: "Goal not found.", success: false };
  }

  revalidatePath("/goals");
  return { error: null, success: true };
}

export async function deleteGoal(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) {
    console.error("Goal delete failed:", error);
  } else if (!data || data.length === 0) {
    console.warn("Goal delete affected no rows:", id);
  }

  revalidatePath("/goals");
}
