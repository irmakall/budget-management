import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/nav";
import { PeriodNav } from "@/components/period-nav";
import { money, round2 } from "@/lib/format";
import { getPeriod, getPeriodRange, today } from "@/lib/period";
import { TransactionForm } from "./transaction-form";
import { TransactionFilters } from "./transaction-filters";
import { TransactionRow, type Transaction } from "./transaction-row";

const PAGE_SIZE = 50;

type Query = {
  period?: string;
  q?: string;
  category?: string;
  type?: string;
  page?: string;
};

export default async function TransactionPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const params = await searchParams;

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
      <AppShell current="/transactions" title="Transactions">
        <p className="msg msg-error" role="status">
          Could not read your profile settings.
        </p>
      </AppShell>
    );
  }

  const baseCurrency: string = profile.base_currency;
  const startDay: number = profile.month_start_day;

  const currentPeriod = getPeriod(today(), startDay);
  const period =
    params.period && /^\d{4}-\d{2}$/.test(params.period)
      ? params.period
      : currentPeriod;

  const { start, end } = getPeriodRange(period, startDay);

  const search = (params.q ?? "").trim().slice(0, 80);
  const categoryFilter = params.category ?? "";
  const typeFilter =
    params.type === "income" || params.type === "expense" ? params.type : "";
  const page = Math.max(1, Number(params.page) || 1);

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  const from = (page - 1) * PAGE_SIZE;

  let pageQuery = supabase
    .from("transactions")
    .select(
      "id, amount, currency, amount_base, type, date, note, category_id, categories(name, icon, color)",
      { count: "exact" },
    )
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end);

  let totalsQuery = supabase
    .from("transactions")
    .select("amount_base, type")
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end);

  if (search !== "") {
    pageQuery = pageQuery.ilike("note", `%${search}%`);
    totalsQuery = totalsQuery.ilike("note", `%${search}%`);
  }
  if (typeFilter !== "") {
    pageQuery = pageQuery.eq("type", typeFilter);
    totalsQuery = totalsQuery.eq("type", typeFilter);
  }
  if (categoryFilter === "none") {
    pageQuery = pageQuery.is("category_id", null);
    totalsQuery = totalsQuery.is("category_id", null);
  } else if (categoryFilter !== "") {
    pageQuery = pageQuery.eq("category_id", categoryFilter);
    totalsQuery = totalsQuery.eq("category_id", categoryFilter);
  }

  const [pageRes, totalsRes] = await Promise.all([
    pageQuery
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1),
    totalsQuery,
  ]);

  if (catError || pageRes.error || totalsRes.error) {
    return (
      <AppShell current="/transactions" title="Transactions">
        <p className="msg msg-error" role="status">
          Could not load this period.
        </p>
      </AppShell>
    );
  }

  const rows = (pageRes.data ?? []) as unknown as Transaction[];
  const totalCount = pageRes.count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const allRows = totalsRes.data ?? [];
  const sum = (list: { amount_base: number }[]) =>
    round2(list.reduce((acc, r) => acc + Number(r.amount_base), 0));

  const income = sum(allRows.filter((r) => r.type === "income"));
  const expense = sum(allRows.filter((r) => r.type === "expense"));
  const net = round2(income - expense);

  const filtered = search !== "" || categoryFilter !== "" || typeFilter !== "";

  const pageHref = (n: number) => {
    const q = new URLSearchParams();
    q.set("period", period);
    if (search !== "") q.set("q", search);
    if (categoryFilter !== "") q.set("category", categoryFilter);
    if (typeFilter !== "") q.set("type", typeFilter);
    if (n > 1) q.set("page", String(n));
    return `/transactions?${q.toString()}`;
  };

  const exportHref = () => {
    const q = new URLSearchParams();
    q.set("period", period);
    if (search !== "") q.set("q", search);
    if (categoryFilter !== "") q.set("category", categoryFilter);
    if (typeFilter !== "") q.set("type", typeFilter);
    return `/transactions/export?${q.toString()}`;
  };

  return (
    <AppShell
      current="/transactions"
      title="Transactions"
      meta={
        filtered
          ? `${totalCount} matching this period`
          : `${totalCount} in this period`
      }
      actions={
        <PeriodNav
          basePath="/transactions"
          period={period}
          startDay={startDay}
        />
      }
    >
      <div className="space-y-4">
        <dl className="stats">
          <div className="stat stat-pos">
            <dt className="stat-label">Income</dt>
            <dd className="stat-value num num-pos">
              {money(income, baseCurrency)}
            </dd>
          </div>
          <div className="stat stat-neg">
            <dt className="stat-label">Expense</dt>
            <dd className="stat-value num num-neg">
              {money(expense, baseCurrency)}
            </dd>
          </div>
          <div className="stat stat-net">
            <dt className="stat-label">Net</dt>
            <dd
              className="stat-value num"
              style={{ color: net < 0 ? "var(--neg)" : "var(--primary)" }}
            >
              {money(net, baseCurrency)}
            </dd>
          </div>
        </dl>

        <TransactionForm categories={categories ?? []} />

        <TransactionFilters
          period={period}
          search={search}
          category={categoryFilter}
          type={typeFilter}
          categories={categories ?? []}
          filtered={filtered}
          exportHref={exportHref()}
        />

        {rows.length === 0 ? (
          <p className="empty">
            {filtered
              ? "Nothing matches these filters. Try clearing them."
              : "Nothing recorded in this period yet. Add the first one above."}
          </p>
        ) : (
          <>
            <ul className="rows">
              {rows.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  categories={categories ?? []}
                  baseCurrency={baseCurrency}
                  formattedAmount={money(Number(t.amount), t.currency)}
                  formattedBase={money(Number(t.amount_base), baseCurrency)}
                />
              ))}
            </ul>

            {totalPages > 1 && (
              <nav
                className="flex items-center justify-between gap-3"
                aria-label="Pagination"
              >
                {page > 1 ? (
                  <Link
                    href={pageHref(page - 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    ← Newer
                  </Link>
                ) : (
                  <span />
                )}
                <span className="note">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={pageHref(page + 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Older →
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
