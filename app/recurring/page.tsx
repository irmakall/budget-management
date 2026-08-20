import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/nav";
import { money } from "@/lib/format";
import { today } from "@/lib/period";
import { nextOccurrence } from "@/lib/recurring";
import { getRulesAndDue } from "@/lib/recurring-server";
import { PostDue } from "./post-due";
import { RuleForm } from "./rule-form";
import { RuleRow } from "./rule-row";

export default async function RecurringPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("base_currency")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return (
      <AppShell current="/recurring" title="Recurring">
        <p className="msg msg-error" role="status">
          Could not read your profile settings.
        </p>
      </AppShell>
    );
  }

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  const now = today();
  const { rules, due, error } = await getRulesAndDue(supabase, user.id, now);

  if (catError || error) {
    return (
      <AppShell current="/recurring" title="Recurring">
        <p className="msg msg-error" role="status">
          Could not load your recurring entries.
        </p>
      </AppShell>
    );
  }

  const categoryList = categories ?? [];
  const categoryName = (id: string | null) =>
    id === null ? null : (categoryList.find((c) => c.id === id)?.name ?? null);

  const dueByRule = new Map<string, number>();
  for (const d of due) {
    dueByRule.set(d.ruleId, (dueByRule.get(d.ruleId) ?? 0) + 1);
  }

  const preview = due.slice(0, 8).map((d) => ({
    key: `${d.ruleId}|${d.date}`,
    label: `${d.date} · ${d.name} · ${d.type === "income" ? "+" : "−"}${money(
      d.amount,
      d.currency,
    )}`,
  }));

  const active = rules.filter((r) => r.active).length;

  return (
    <AppShell
      current="/recurring"
      title="Recurring"
      meta={`${active} active of ${rules.length}`}
    >
      <div className="space-y-4">
        {due.length > 0 && <PostDue count={due.length} preview={preview} />}

        <RuleForm
          categories={categoryList}
          defaultCurrency={profile.base_currency}
          todayIso={now}
        />

        <p className="note">
          Rules never write to your ledger on their own — you post them from
          here, so a month you were away does not quietly fill up with entries.
          Each posted entry freezes the rate of its own date.
        </p>

        {rules.length === 0 ? (
          <p className="empty">
            No recurring entries yet. Rent, salary and subscriptions are the
            usual first three.
          </p>
        ) : (
          <ul className="rows">
            {rules.map((rule) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                categories={categoryList}
                categoryName={categoryName(rule.category_id)}
                formattedAmount={money(Number(rule.amount), rule.currency)}
                nextDate={nextOccurrence(
                  rule.start_date,
                  rule.end_date,
                  rule.day_of_month,
                  now,
                )}
                dueCount={dueByRule.get(rule.id) ?? 0}
              />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
