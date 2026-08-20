"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getRate } from "@/lib/rates";
import { CURRENCIES } from "@/lib/currencies";

export type TransactionState = { error: string | null; success: boolean };

const TYPES = ["income", "expense"];

export async function createTransaction(
  _prevState: TransactionState,
  formData: FormData,
): Promise<TransactionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", success: false };
  }

  const parsed = readFields(formData);
  if (!parsed.ok) return { error: parsed.error, success: false };
  const f = parsed.fields;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("base_currency")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Could not read your profile settings.", success: false };
  }

  let rate: number;
  try {
    rate = await getRate(f.currency, profile.base_currency, f.date);
  } catch {
    return {
      error: "Could not fetch the exchange rate. Try again.",
      success: false,
    };
  }

  const amountBase = Math.round(f.amount * rate * 100) / 100;

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    category_id: f.categoryId,
    amount: f.amount,
    currency: f.currency,
    rate_to_base: rate,
    amount_base: amountBase,
    type: f.type,
    date: f.date,
    note: f.note,
  });

  if (error) return { error: error.message, success: false };

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

type Fields = {
  amount: number;
  currency: string;
  type: string;
  date: string;
  categoryId: string | null;
  note: string | null;
};

type Parsed = { ok: false; error: string } | { ok: true; fields: Fields };

function readFields(formData: FormData): Parsed {
  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Amount must be a number greater than 0." };
  }

  const currency = String(formData.get("currency") ?? "");
  if (!(CURRENCIES as readonly string[]).includes(currency)) {
    return { ok: false, error: "Select a valid currency." };
  }

  const type = String(formData.get("type") ?? "");
  if (!TYPES.includes(type)) {
    return { ok: false, error: "Select a valid type." };
  }

  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Select a valid date." };
  }

  const rawCategory = String(formData.get("category_id") ?? "");
  const rawNote = String(formData.get("note") ?? "").trim();

  return {
    ok: true,
    fields: {
      amount,
      currency,
      type,
      date,
      categoryId: rawCategory === "" ? null : rawCategory,
      note: rawNote === "" ? null : rawNote,
    },
  };
}

export async function updateTransaction(
  _prevState: TransactionState,
  formData: FormData,
): Promise<TransactionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", success: false };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing transaction id.", success: false };

  const parsed = readFields(formData);
  if (!parsed.ok) return { error: parsed.error, success: false };
  const f = parsed.fields;

  const { data: existing, error: readError } = await supabase
    .from("transactions")
    .select("currency, rate_to_base")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (readError || !existing) {
    return { error: "Transaction not found.", success: false };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("base_currency")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Could not read your profile settings.", success: false };
  }

  const currencyChanged = existing.currency !== f.currency;
  const askedForRefresh = formData.get("refresh_rate") !== null;

  let rate = Number(existing.rate_to_base);
  if (currencyChanged || askedForRefresh) {
    try {
      rate = await getRate(f.currency, profile.base_currency, f.date);
    } catch {
      return {
        error: "Could not fetch the exchange rate. Try again.",
        success: false,
      };
    }
  }

  const amountBase = Math.round(f.amount * rate * 100) / 100;

  const { data, error } = await supabase
    .from("transactions")
    .update({
      category_id: f.categoryId,
      amount: f.amount,
      currency: f.currency,
      rate_to_base: rate,
      amount_base: amountBase,
      type: f.type,
      date: f.date,
      note: f.note,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return { error: error.message, success: false };
  if (!data || data.length === 0) {
    return { error: "Transaction not found.", success: false };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }

  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) {
    console.error("Delete failed:", error);
  } else if (!data || data.length === 0) {
    console.warn("Delete affected no rows:", id);
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
