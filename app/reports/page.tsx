import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/nav";
import { money, round2 } from "@/lib/format";
import {
  getPeriod,
  getPeriodLabel,
  getPeriodRange,
  shiftPeriod,
} from "@/lib/period";
import { colorFor, OTHER } from "@/lib/chart-colors";
import { Donut, type Slice } from "@/components/charts/donut";
import { Bars, type BarPoint } from "@/components/charts/bars";
import { NetLine, type LinePoint } from "@/components/charts/net-line";

const PERIODS_BACK = 6;

type Tx = {
  amount_base: number;
  type: string;
  date: string;
  category_id: string | null;
  categories: { name: string; color: string | null } | null;
};

function shortLabel(period: string) {
  const [y, m] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(
    new Date(y, m - 1, 1),
  );
}

export default async function ReportsPage() {
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
      <AppShell current="/reports" title="Reports">
        <p className="msg msg-error" role="status">
          Could not read your profile settings.
        </p>
      </AppShell>
    );
  }

  const baseCurrency: string = profile.base_currency;
  const startDay: number = profile.month_start_day;

  const current = getPeriod(new Date().toLocaleDateString("en-CA"), startDay);

  const periods = Array.from({ length: PERIODS_BACK }, (_, i) =>
    shiftPeriod(current, i - (PERIODS_BACK - 1)),
  );

  const windowStart = getPeriodRange(periods[0], startDay).start;
  const windowEnd = getPeriodRange(current, startDay).end;

  const { data, error } = await supabase
    .from("transactions")
    .select("amount_base, type, date, category_id, categories(name, color)")
    .eq("user_id", user.id)
    .gte("date", windowStart)
    .lte("date", windowEnd);

  if (error) {
    return (
      <AppShell current="/reports" title="Reports">
        <p className="msg msg-error" role="status">
          Could not load report data.
        </p>
      </AppShell>
    );
  }

  const rows = (data ?? []) as unknown as Tx[];

  const byPeriod = new Map<string, { income: number; expense: number }>();
  for (const p of periods) byPeriod.set(p, { income: 0, expense: 0 });

  for (const r of rows) {
    const p = getPeriod(r.date, startDay);
    const bucket = byPeriod.get(p);
    if (!bucket) continue;
    if (r.type === "income") bucket.income += Number(r.amount_base);
    else bucket.expense += Number(r.amount_base);
  }

  const barPoints: BarPoint[] = periods.map((p) => {
    const b = byPeriod.get(p)!;
    return {
      period: p,
      label: shortLabel(p),
      income: round2(b.income),
      expense: round2(b.expense),
      formattedIncome: money(round2(b.income), baseCurrency),
      formattedExpense: money(round2(b.expense), baseCurrency),
    };
  });

  const linePoints: LinePoint[] = periods.map((p) => {
    const b = byPeriod.get(p)!;
    const net = round2(b.income - b.expense);
    return {
      period: p,
      label: shortLabel(p),
      net,
      formattedNet: money(net, baseCurrency),
    };
  });

  const spend = new Map<
    string,
    { name: string; color: string | null; sum: number }
  >();
  for (const r of rows) {
    if (r.type !== "expense") continue;
    if (getPeriod(r.date, startDay) !== current) continue;
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
  const TOP = 6;
  const head = sorted.slice(0, TOP);
  const tail = sorted.slice(TOP);

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

  return (
    <AppShell
      current="/reports"
      title="Reports"
      meta={`Last ${PERIODS_BACK} periods`}
    >
      <div className="space-y-4">
        <section className="card card-pad space-y-2">
          <h2 className="row-title">
            Where your money went · {getPeriodLabel(current, startDay)}
          </h2>
          {slices.length === 0 ? (
            <p className="empty" style={{ boxShadow: "none" }}>
              No spending recorded in this period yet.
            </p>
          ) : (
            <Donut
              slices={slices}
              total={spendTotal}
              formattedTotal={money(spendTotal, baseCurrency)}
            />
          )}
        </section>

        <section className="card card-pad space-y-2">
          <h2 className="row-title">Income vs expense</h2>
          <Bars points={barPoints} />
        </section>

        <section className="card card-pad space-y-2">
          <h2 className="row-title">Net balance trend</h2>
          <NetLine points={linePoints} />
        </section>

        <details className="card card-pad">
          <summary className="details-summary">
            Show the same data as a table
          </summary>
          <div className="table-scroll" style={{ marginTop: "0.75rem" }}>
            <table className="table">
              <caption className="sr-only">
                Income, expense and net for the last {PERIODS_BACK} periods
              </caption>
              <thead>
                <tr>
                  <th scope="col">Period</th>
                  <th scope="col" className="align-end">
                    Income
                  </th>
                  <th scope="col" className="align-end">
                    Expense
                  </th>
                  <th scope="col" className="align-end">
                    Net
                  </th>
                </tr>
              </thead>
              <tbody>
                {periods.map((p, i) => (
                  <tr key={p}>
                    <th scope="row" style={{ fontWeight: 600 }}>
                      {getPeriodLabel(p, startDay)}
                    </th>
                    <td className="num align-end">
                      {barPoints[i].formattedIncome}
                    </td>
                    <td className="num align-end">
                      {barPoints[i].formattedExpense}
                    </td>
                    <td
                      className="num align-end"
                      style={{
                        color:
                          linePoints[i].net < 0 ? "var(--neg)" : "var(--ink)",
                      }}
                    >
                      {linePoints[i].formattedNet}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </AppShell>
  );
}
