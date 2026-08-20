import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/nav";
import { PeriodNav } from "@/components/period-nav";
import { money, round2 } from "@/lib/format";
import { getPeriod, getPeriodRange, shiftPeriod } from "@/lib/period";
import { BudgetRow } from "./budget-row";
import { copyPreviousBudgets } from "./actions";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("base_currency, month_start_day")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return (
      <AppShell current="/budgets" title="Budgets">
        <p className="msg msg-error" role="status">
          Could not read your profile settings.
        </p>
      </AppShell>
    );
  }

  const baseCurrency: string = profile.base_currency;
  const startDay: number = profile.month_start_day;

  const currentPeriod = getPeriod(
    new Date().toLocaleDateString("en-CA"),
    startDay,
  );
  const period =
    periodParam && /^\d{4}-\d{2}$/.test(periodParam)
      ? periodParam
      : currentPeriod;

  const { start, end } = getPeriodRange(period, startDay);

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name, icon, color")
    .eq("user_id", user.id)
    .eq("type", "expense")
    .order("name", { ascending: true });

  const { data: budgets, error: budgetError } = await supabase
    .from("budgets")
    .select("category_id, amount")
    .eq("user_id", user.id)
    .eq("period", period);

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .select("category_id, amount_base")
    .eq("user_id", user.id)
    .eq("type", "expense")
    .gte("date", start)
    .lte("date", end);

  if (catError || budgetError || txError) {
    return (
      <AppShell current="/budgets" title="Budgets">
        <p className="msg msg-error" role="status">
          Could not load budgets.
        </p>
      </AppShell>
    );
  }

  const limits = new Map<string, number>();
  for (const b of budgets ?? []) limits.set(b.category_id, Number(b.amount));

  const spentByCategory = new Map<string, number>();
  for (const t of tx ?? []) {
    if (!t.category_id) continue;
    spentByCategory.set(
      t.category_id,
      (spentByCategory.get(t.category_id) ?? 0) + Number(t.amount_base),
    );
  }

  const list = (categories ?? []) as unknown as Category[];

  const totalLimit = round2([...limits.values()].reduce((a, v) => a + v, 0));
  const totalSpent = round2(
    list
      .filter((c) => limits.has(c.id))
      .reduce((acc, c) => acc + (spentByCategory.get(c.id) ?? 0), 0),
  );
  const remaining = round2(totalLimit - totalSpent);

  return (
    <AppShell
      current="/budgets"
      title="Budgets"
      meta={`${limits.size} of ${list.length} categories limited`}
      actions={
        <PeriodNav basePath="/budgets" period={period} startDay={startDay} />
      }
    >
      <div className="space-y-4">
        <dl className="stats">
          <div className="stat stat-net">
            <dt className="stat-label">Budgeted</dt>
            <dd className="stat-value num" style={{ color: "var(--primary)" }}>
              {money(totalLimit, baseCurrency)}
            </dd>
          </div>
          <div className="stat stat-neg">
            <dt className="stat-label">Spent</dt>
            <dd className="stat-value num num-neg">
              {money(totalSpent, baseCurrency)}
            </dd>
          </div>
          <div className="stat stat-pos">
            <dt className="stat-label">Remaining</dt>
            <dd
              className="stat-value num"
              style={{ color: remaining < 0 ? "var(--neg)" : "var(--pos)" }}
            >
              {money(remaining, baseCurrency)}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="note">
            Limits are in {baseCurrency}. Clear a field and press Set to remove
            its limit.
          </p>

          {limits.size === 0 && (
            <form action={copyPreviousBudgets}>
              <input type="hidden" name="period" value={period} />
              <button type="submit" className="btn btn-secondary btn-sm">
                Copy from {shiftPeriod(period, -1)}
              </button>
            </form>
          )}
        </div>

        {list.length === 0 ? (
          <p className="empty">
            No expense categories yet. Create some on the Categories page first.
          </p>
        ) : (
          <ul className="rows">
            {list.map((c) => {
              const limit = limits.get(c.id) ?? null;
              const spent = round2(spentByCategory.get(c.id) ?? 0);
              return (
                <BudgetRow
                  key={c.id}
                  categoryId={c.id}
                  categoryName={c.name}
                  icon={c.icon}
                  color={c.color}
                  period={period}
                  limit={limit}
                  spent={spent}
                  formattedSpent={money(spent, baseCurrency)}
                  formattedLimit={
                    limit === null ? null : money(limit, baseCurrency)
                  }
                />
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
