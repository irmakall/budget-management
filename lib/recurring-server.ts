import type { createClient } from "@/lib/supabase/server";
import { occurrencesUpTo } from "@/lib/recurring";

type Client = Awaited<ReturnType<typeof createClient>>;

export type Rule = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  type: string;
  day_of_month: number;
  start_date: string;
  end_date: string | null;
  active: boolean;
  category_id: string | null;
};

export type Due = {
  ruleId: string;
  name: string;
  date: string;
  amount: number;
  currency: string;
  type: string;
};

export async function getRulesAndDue(
  supabase: Client,
  userId: string,
  now: string,
): Promise<{ rules: Rule[]; due: Due[]; error: boolean }> {
  const [ruleRes, postedRes] = await Promise.all([
    supabase
      .from("recurring_rules")
      .select(
        "id, name, amount, currency, type, day_of_month, start_date, end_date, active, category_id",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("recurring_rule_id, date")
      .eq("user_id", userId)
      .not("recurring_rule_id", "is", null),
  ]);

  if (ruleRes.error || postedRes.error) {
    return { rules: [], due: [], error: true };
  }

  const rules = (ruleRes.data ?? []) as unknown as Rule[];
  const already = new Set(
    (postedRes.data ?? []).map((r) => `${r.recurring_rule_id}|${r.date}`),
  );

  const due: Due[] = [];
  for (const rule of rules) {
    if (!rule.active) continue;
    const dates = occurrencesUpTo(
      rule.start_date,
      rule.end_date,
      rule.day_of_month,
      now,
    );
    for (const date of dates) {
      if (already.has(`${rule.id}|${date}`)) continue;
      due.push({
        ruleId: rule.id,
        name: rule.name,
        date,
        amount: Number(rule.amount),
        currency: rule.currency,
        type: rule.type,
      });
    }
  }

  due.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return { rules, due, error: false };
}
