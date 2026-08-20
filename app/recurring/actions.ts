"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getRate } from "@/lib/rates";
import { CURRENCIES } from "@/lib/currencies";
import { today } from "@/lib/period";
import { occurrencesUpTo } from "@/lib/recurring";

export type RecurringState = { error: string | null; success: boolean };
export type PostState = {
  error: string | null;
  posted: number;
  skipped: string[];
};

const TYPES = ["income", "expense"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NAME = 60;

type Fields = {
  name: string;
  amount: number;
  currency: string;
  type: string;
  dayOfMonth: number;
  startDate: string;
  endDate: string | null;
  categoryId: string | null;
};

type Parsed = { ok: false; error: string } | { ok: true; fields: Fields };

function readFields(formData: FormData): Parsed {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length === 0) return { ok: false, error: "Name is required." };
  if (name.length > MAX_NAME) {
    return { ok: false, error: `Name must be at most ${MAX_NAME} characters.` };
  }

  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Amount must be greater than 0." };
  }

  const currency = String(formData.get("currency") ?? "");
  if (!(CURRENCIES as readonly string[]).includes(currency)) {
    return { ok: false, error: "Select a valid currency." };
  }

  const type = String(formData.get("type") ?? "");
  if (!TYPES.includes(type)) {
    return { ok: false, error: "Select a valid type." };
  }

  const dayOfMonth = Number(formData.get("day_of_month"));
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 28) {
    return {
      ok: false,
      error: "Day of month must be between 1 and 28, so every month has it.",
    };
  }

  const startDate = String(formData.get("start_date") ?? "");
  if (!DATE_RE.test(startDate)) {
    return { ok: false, error: "Select a valid start date." };
  }

  const rawEnd = String(formData.get("end_date") ?? "").trim();
  if (rawEnd !== "" && !DATE_RE.test(rawEnd)) {
    return { ok: false, error: "Select a valid end date." };
  }
  if (rawEnd !== "" && rawEnd < startDate) {
    return {
      ok: false,
      error: "The end date cannot be before the start date.",
    };
  }

  const rawCategory = String(formData.get("category_id") ?? "");

  return {
    ok: true,
    fields: {
      name,
      amount,
      currency,
      type,
      dayOfMonth,
      startDate,
      endDate: rawEnd === "" ? null : rawEnd,
      categoryId: rawCategory === "" ? null : rawCategory,
    },
  };
}

function toRow(f: Fields) {
  return {
    name: f.name,
    amount: f.amount,
    currency: f.currency,
    type: f.type,
    day_of_month: f.dayOfMonth,
    start_date: f.startDate,
    end_date: f.endDate,
    category_id: f.categoryId,
  };
}

export async function createRule(
  _prevState: RecurringState,
  formData: FormData,
): Promise<RecurringState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", success: false };

  const parsed = readFields(formData);
  if (!parsed.ok) return { error: parsed.error, success: false };

  const { error } = await supabase
    .from("recurring_rules")
    .insert({ user_id: user.id, ...toRow(parsed.fields) });

  if (error) return { error: error.message, success: false };

  revalidatePath("/recurring");
  return { error: null, success: true };
}

export async function updateRule(
  _prevState: RecurringState,
  formData: FormData,
): Promise<RecurringState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", success: false };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing rule id.", success: false };

  const parsed = readFields(formData);
  if (!parsed.ok) return { error: parsed.error, success: false };

  const { data, error } = await supabase
    .from("recurring_rules")
    .update(toRow(parsed.fields))
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return { error: error.message, success: false };
  if (!data || data.length === 0) {
    return { error: "Rule not found.", success: false };
  }

  revalidatePath("/recurring");
  return { error: null, success: true };
}

export async function toggleRule(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("recurring_rules")
    .update({ active })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) console.error("Toggle rule failed:", error);

  revalidatePath("/recurring");
}

export async function deleteRule(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("recurring_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) {
    console.error("Rule delete failed:", error);
  } else if (!data || data.length === 0) {
    console.warn("Rule delete affected no rows:", id);
  }

  revalidatePath("/recurring");
}

export async function postDue(
  _prevState: PostState,
  formData: FormData,
): Promise<PostState> {
  const onlyRuleId = String(formData.get("rule_id") ?? "");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", posted: 0, skipped: [] };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("base_currency")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: "Could not read your profile settings.",
      posted: 0,
      skipped: [],
    };
  }

  const baseCurrency: string = profile.base_currency;
  const now = today();

  let ruleQuery = supabase
    .from("recurring_rules")
    .select(
      "id, name, amount, currency, type, day_of_month, start_date, end_date, category_id",
    )
    .eq("user_id", user.id)
    .eq("active", true);

  if (onlyRuleId !== "") ruleQuery = ruleQuery.eq("id", onlyRuleId);

  const { data: rules, error: ruleError } = await ruleQuery;

  if (ruleError) {
    return {
      error: "Could not read your recurring entries.",
      posted: 0,
      skipped: [],
    };
  }
  if (!rules || rules.length === 0) {
    return { error: null, posted: 0, skipped: [] };
  }

  const { data: existing, error: existingError } = await supabase
    .from("transactions")
    .select("recurring_rule_id, date")
    .eq("user_id", user.id)
    .not("recurring_rule_id", "is", null);

  if (existingError) {
    return {
      error: "Could not check what is already posted.",
      posted: 0,
      skipped: [],
    };
  }

  const already = new Set(
    (existing ?? []).map((r) => `${r.recurring_rule_id}|${r.date}`),
  );

  const rateCache = new Map<string, number>();
  const payload: Record<string, unknown>[] = [];
  const skipped: string[] = [];

  for (const rule of rules) {
    const dates = occurrencesUpTo(
      String(rule.start_date),
      (rule.end_date as string | null) ?? null,
      Number(rule.day_of_month),
      now,
    );

    for (const date of dates) {
      if (already.has(`${rule.id}|${date}`)) continue;

      const currency = String(rule.currency);
      const key = `${currency}|${date}`;
      let rate = rateCache.get(key);

      if (rate === undefined) {
        try {
          rate = await getRate(currency, baseCurrency, date);
          rateCache.set(key, rate);
        } catch {
          skipped.push(
            `${rule.name} · ${date}: no ${currency}→${baseCurrency} rate.`,
          );
          continue;
        }
      }

      const amount = Number(rule.amount);

      payload.push({
        user_id: user.id,
        category_id: rule.category_id,
        recurring_rule_id: rule.id,
        amount,
        currency,
        rate_to_base: rate,
        amount_base: Math.round(amount * rate * 100) / 100,
        type: rule.type,
        date,
        note: rule.name,
      });
    }
  }

  if (payload.length === 0) {
    return { error: null, posted: 0, skipped };
  }

  const { error } = await supabase.from("transactions").insert(payload);
  if (error) return { error: error.message, posted: 0, skipped };

  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return { error: null, posted: payload.length, skipped };
}
