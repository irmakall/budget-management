import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/nav";
import { PeriodNav } from "@/components/period-nav";
import { money, round2 } from "@/lib/format";
import {
  getPeriod,
  getPeriodRange,
  monthsUntil,
  shiftPeriod,
  today,
} from "@/lib/period";
import { colorFor, OTHER } from "@/lib/chart-colors";
import { COLOR_TINTS, DEFAULT_TINT } from "@/app/categories/constants";
import { getRulesAndDue } from "@/lib/recurring-server";
import { Donut, type Slice } from "@/components/charts/donut";
import { TransactionForm } from "@/app/transactions/transaction-form";

type Tx = {
  id: string;
  amount: number;
  currency: string;
  amount_base: number;
  type: string;
  date: string;
  note: string | null;
  category_id: string | null;
  categories: {
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
};

export default async function DashboardPage({
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
      <AppShell current="/dashboard" title="Overview">
        <p className="msg msg-error" role="status">
          Could not read your profile settings.
        </p>
      </AppShell>
    );
  }

  const baseCurrency: string = profile.base_currency;
  const startDay: number = profile.month_start_day;

  const now = today();
  const currentPeriod = getPeriod(now, startDay);
  const period =
    periodParam && /^\d{4}-\d{2}$/.test(periodParam)
      ? periodParam
      : currentPeriod;

  const { start, end } = getPeriodRange(period, startDay);
  const previous = shiftPeriod(period, -1);
  const previousRange = getPeriodRange(previous, startDay);

  const [txRes, prevRes, catRes, budgetRes, goalRes] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "id, amount, currency, amount_base, type, date, note, category_id, categories(name, icon, color)",
      )
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("amount_base, type")
      .eq("user_id", user.id)
      .gte("date", previousRange.start)
      .lte("date", previousRange.end),
    supabase
      .from("categories")
      .select("id, name, type")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("budgets")
      .select("category_id, amount")
      .eq("user_id", user.id)
      .eq("period", period),
    supabase
      .from("goals")
      .select("id, name, currency, target_amount, current_amount, target_date")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  if (txRes.error || catRes.error) {
    return (
      <AppShell current="/dashboard" title="Overview">
        <p className="msg msg-error" role="status">
          Could not load this period.
        </p>
      </AppShell>
    );
  }

  const rows = (txRes.data ?? []) as unknown as Tx[];
  const categories = catRes.data ?? [];

  const sum = (list: { amount_base: number }[]) =>
    round2(list.reduce((acc, r) => acc + Number(r.amount_base), 0));

  const income = sum(rows.filter((r) => r.type === "income"));
  const expense = sum(rows.filter((r) => r.type === "expense"));
  const net = round2(income - expense);
  const savedPct = income > 0 ? Math.round((net / income) * 100) : null;

  const prevRows = prevRes.data ?? [];
  const prevIncome = sum(prevRows.filter((r) => r.type === "income"));
  const prevExpense = sum(prevRows.filter((r) => r.type === "expense"));
  const prevNet = round2(prevIncome - prevExpense);
  const hasPrevious = prevRows.length > 0;
  const netDelta = round2(net - prevNet);
  const spendDelta =
    hasPrevious && prevExpense > 0
      ? Math.round(((expense - prevExpense) / prevExpense) * 100)
      : null;

  const spend = new Map<
    string,
    { name: string; color: string | null; sum: number }
  >();
  for (const r of rows) {
    if (r.type !== "expense") continue;
    const key = r.category_id ?? "uncategorized";
    const entry = spend.get(key) ?? {
      name: r.categories?.name ?? "Uncategorized",
      color: r.categories?.color ?? null,
      sum: 0,
    };
    entry.sum += Number(r.amount_base);
    spend.set(key, entry);
  }

  const sorted = [...spend.entries()].sort((a, b) => b[1].sum - a[1].sum);
  const head = sorted.slice(0, 5);
  const tail = sorted.slice(5);

  const slices: Slice[] = head.map(([id, v]) => ({
    id,
    label: v.name,
    value: round2(v.sum),
    formatted: money(round2(v.sum), baseCurrency),
    color: colorFor(id, v.color),
  }));
  if (tail.length > 0) {
    const rest = round2(tail.reduce((acc, [, v]) => acc + v.sum, 0));
    slices.push({
      id: "__other",
      label: `Other (${tail.length})`,
      value: rest,
      formatted: money(rest, baseCurrency),
      color: OTHER,
    });
  }
  const spendTotal = round2(slices.reduce((acc, s) => acc + s.value, 0));

  const spentByCategory = new Map<string, number>();
  for (const [id, v] of spend) spentByCategory.set(id, v.sum);

  const budgets = (budgetRes.data ?? [])
    .map((b) => {
      const cat = categories.find((c) => c.id === b.category_id);
      const spent = round2(spentByCategory.get(b.category_id) ?? 0);
      const limit = Number(b.amount);
      return {
        id: b.category_id as string,
        name: cat?.name ?? "Category",
        spent,
        limit,
        over: round2(Math.max(0, spent - limit)),
        ratio: limit > 0 ? spent / limit : 0,
      };
    })
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 5);

  const goals = (goalRes.data ?? []).map((g) => {
    const target = Number(g.target_amount);
    const current = Number(g.current_amount);
    const remaining = round2(Math.max(0, target - current));
    const targetDate = (g.target_date as string | null) ?? null;
    const monthsLeft = targetDate ? monthsUntil(targetDate, now) : null;
    return {
      id: g.id as string,
      name: g.name as string,
      currency: g.currency as string,
      target,
      current,
      remaining,
      targetDate,
      monthsLeft,
      perMonth:
        monthsLeft !== null && remaining > 0
          ? round2(remaining / monthsLeft)
          : null,
      pct: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
    };
  });

  const recent = rows.slice(0, 5);

  const { due } = await getRulesAndDue(supabase, user.id, now);

  return (
    <AppShell
      current="/dashboard"
      title="Overview"
      meta={`${rows.length} transactions in this period`}
      sidebarNote={user.email ?? undefined}
      actions={
        <PeriodNav basePath="/dashboard" period={period} startDay={startDay} />
      }
    >
      <div className="grid">
        {due.length > 0 && (
          <section className="panel span-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="row-title">
                {due.length} recurring entr{due.length === 1 ? "y" : "ies"} are
                waiting to be posted.
              </p>
              <Link href="/recurring" className="btn btn-secondary btn-sm">
                Review them →
              </Link>
            </div>
          </section>
        )}

        <section className="span-12">
          <div className="hero-card">
            <div className="hero-row">
              <div>
                <p className="hero-label">Net this period</p>
                <p className="hero-value">{money(net, baseCurrency)}</p>
                {hasPrevious ? (
                  <p className="mt-2">
                    <span className="hero-chip">
                      {netDelta >= 0 ? "▲" : "▼"}{" "}
                      {money(Math.abs(netDelta), baseCurrency)} vs last period
                    </span>
                  </p>
                ) : (
                  <p className="hero-label mt-2">
                    No data for last period yet.
                  </p>
                )}
              </div>

              <div className="hero-stats">
                <span>
                  <span className="hero-label">Income</span>
                  <br />
                  <span className="num">{money(income, baseCurrency)}</span>
                </span>
                <span>
                  <span className="hero-label">Expense</span>
                  <br />
                  <span className="num">{money(expense, baseCurrency)}</span>
                  {spendDelta !== null && (
                    <>
                      <br />
                      <span className="hero-label">
                        {spendDelta >= 0 ? "+" : "−"}
                        {Math.abs(spendDelta)}% vs last period
                      </span>
                    </>
                  )}
                </span>
                <span>
                  <span className="hero-label">Saved · net ÷ income</span>
                  <br />
                  <span className="num">
                    {savedPct === null ? "—" : `${savedPct}%`}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel span-12">
          <div className="panel-head">
            <h2 className="panel-title">Quick add</h2>
            <Link href="/transactions" className="panel-link">
              All transactions →
            </Link>
          </div>
          <TransactionForm categories={categories} bare />
        </section>

        <div className="span-7 stack">
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Where your money went</h2>
              <Link href="/reports" className="panel-link">
                Reports →
              </Link>
            </div>
            {slices.length === 0 ? (
              <p className="note">No spending recorded in this period yet.</p>
            ) : (
              <Donut
                slices={slices}
                total={spendTotal}
                formattedTotal={money(spendTotal, baseCurrency)}
              />
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Recent</h2>
              <Link href="/transactions" className="panel-link">
                All transactions →
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="note">Nothing recorded yet.</p>
            ) : (
              <ul>
                {recent.map((t) => {
                  const isIncome = t.type === "income";
                  const color = t.categories?.color ?? null;
                  const tint = color
                    ? (COLOR_TINTS[color] ?? DEFAULT_TINT)
                    : DEFAULT_TINT;
                  return (
                    <li key={t.id} className="row">
                      <span
                        className="tile"
                        aria-hidden
                        style={{
                          background: tint,
                          color: color ?? "var(--ink-3)",
                        }}
                      >
                        {t.categories?.icon ?? (isIncome ? "↓" : "↑")}
                      </span>
                      <div className="row-main">
                        <p className="row-title">
                          {t.categories?.name ?? "Uncategorized"}
                        </p>
                        <p className="row-meta">
                          {t.date}
                          {t.note ? ` · ${t.note}` : ""}
                        </p>
                      </div>
                      <span
                        className={isIncome ? "num num-pos" : "num num-neg"}
                      >
                        {isIncome ? "+" : "−"}
                        {money(Number(t.amount), t.currency)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="span-5 stack">
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Budgets</h2>
              <Link href="/budgets" className="panel-link">
                Manage →
              </Link>
            </div>
            {budgets.length === 0 ? (
              <p className="note">No limits set for this period.</p>
            ) : (
              <div className="breakdown">
                {budgets.map((b) => {
                  const pct = Math.min(100, Math.round(b.ratio * 100));
                  const color =
                    b.ratio >= 1
                      ? "var(--neg)"
                      : b.ratio >= 0.8
                        ? "var(--warn)"
                        : "var(--primary)";
                  return (
                    <div key={b.id} className="breakdown-row">
                      <span className="breakdown-name">{b.name}</span>
                      <span className="num text-sm" style={{ color }}>
                        {b.over > 0
                          ? `over by ${money(b.over, baseCurrency)}`
                          : `${pct}%`}
                      </span>
                      <span
                        className="breakdown-bar"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${b.name} budget usage`}
                      >
                        <i style={{ width: `${pct}%`, background: color }} />
                      </span>
                      <span className="breakdown-meta num">
                        {money(b.spent, baseCurrency)} of{" "}
                        {money(b.limit, baseCurrency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Goals</h2>
              <Link href="/goals" className="panel-link">
                Manage →
              </Link>
            </div>
            {goals.length === 0 ? (
              <p className="note">No goals yet.</p>
            ) : (
              <div className="breakdown">
                {goals.map((g) => {
                  const done = g.current >= g.target;
                  return (
                    <div key={g.id} className="breakdown-row">
                      <span className="breakdown-name">{g.name}</span>
                      <span className="num text-sm">
                        {money(g.current, g.currency)}
                        <span
                          style={{ color: "var(--ink-3)", fontWeight: 500 }}
                        >
                          {" "}
                          / {money(g.target, g.currency)}
                        </span>
                      </span>
                      <span
                        className="breakdown-bar"
                        role="progressbar"
                        aria-valuenow={g.pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${g.name} progress`}
                      >
                        <i
                          style={{
                            width: `${g.pct}%`,
                            background: done ? "var(--pos)" : "var(--primary)",
                          }}
                        />
                      </span>
                      <span className="breakdown-meta">
                        {done ? (
                          <span style={{ color: "var(--pos)" }}>Reached</span>
                        ) : g.perMonth !== null && g.monthsLeft !== null ? (
                          <>
                            {money(g.perMonth, g.currency)}/month for{" "}
                            {g.monthsLeft} month
                            {g.monthsLeft === 1 ? "" : "s"} · by {g.targetDate}
                          </>
                        ) : g.targetDate ? (
                          <>Target date passed ({g.targetDate})</>
                        ) : (
                          <>
                            {money(g.remaining, g.currency)} left · no target
                            date
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
