import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/nav";
import { money, round2 } from "@/lib/format";
import { getPeriod, getPeriodLabel, getPeriodRange } from "@/lib/period";
import { CategoryForm } from "./category-form";
import { CategoryRow, type Category } from "./category-row";

export default async function CategoriesPage() {
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
      <AppShell current="/categories" title="Categories">
        <p className="msg msg-error" role="status">
          Could not read your profile settings.
        </p>
      </AppShell>
    );
  }

  const baseCurrency: string = profile.base_currency;
  const startDay: number = profile.month_start_day;

  const period = getPeriod(new Date().toLocaleDateString("en-CA"), startDay);
  const { start, end } = getPeriodRange(period, startDay);

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, type, icon, color")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .select("category_id, amount_base")
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end);

  if (error || txError) {
    return (
      <AppShell current="/categories" title="Categories">
        <p className="msg msg-error" role="status">
          Could not load categories.
        </p>
      </AppShell>
    );
  }

  const totals = new Map<string, number>();
  for (const row of tx ?? []) {
    if (!row.category_id) continue;
    totals.set(
      row.category_id,
      (totals.get(row.category_id) ?? 0) + Number(row.amount_base),
    );
  }

  const list = (categories ?? []) as unknown as Category[];
  const expense = list.filter((c) => c.type === "expense");
  const income = list.filter((c) => c.type === "income");

  const group = (title: string, items: Category[]) => (
    <section className="space-y-2">
      <h2 className="section-label">{title}</h2>
      {items.length === 0 ? (
        <p className="empty">No {title.toLowerCase()} categories yet.</p>
      ) : (
        <ul className="rows">
          {items.map((c) => {
            const total = round2(totals.get(c.id) ?? 0);
            return (
              <CategoryRow
                key={c.id}
                category={c}
                total={total}
                formattedTotal={total === 0 ? "—" : money(total, baseCurrency)}
              />
            );
          })}
        </ul>
      )}
    </section>
  );

  return (
    <AppShell
      current="/categories"
      title="Categories"
      meta={`Totals · ${getPeriodLabel(period, startDay)}`}
    >
      <div className="space-y-4">
        <CategoryForm />

        <p className="note">
          Deleting a category keeps its transactions — they become
          uncategorized.
        </p>

        {group("Expense", expense)}
        {group("Income", income)}
      </div>
    </AppShell>
  );
}
