import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/nav";
import { money, round2 } from "@/lib/format";
import { monthsUntil, today } from "@/lib/period";
import { GoalForm } from "./goal-form";
import { GoalRow } from "./goal-row";

type Goal = {
  id: string;
  name: string;
  currency: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
};

export default async function GoalsPage() {
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
      <AppShell current="/goals" title="Savings goals">
        <p className="msg msg-error" role="status">
          Could not read your profile settings.
        </p>
      </AppShell>
    );
  }

  const { data: goals, error } = await supabase
    .from("goals")
    .select("id, name, currency, target_amount, current_amount, target_date")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <AppShell current="/goals" title="Savings goals">
        <p className="msg msg-error" role="status">
          Could not load goals.
        </p>
      </AppShell>
    );
  }

  const list = (goals ?? []) as unknown as Goal[];
  const now = today();
  const reached = list.filter(
    (g) => Number(g.current_amount) >= Number(g.target_amount),
  ).length;

  return (
    <AppShell
      current="/goals"
      title="Savings goals"
      meta={`${reached} of ${list.length} reached`}
    >
      <div className="space-y-4">
        <GoalForm defaultCurrency={profile.base_currency} />

        <p className="note">
          Goals stay in their own currency and are never converted — a $1,000
          goal stays a $1,000 goal.
        </p>

        {list.length === 0 ? (
          <p className="empty">No goals yet. Name the first one above.</p>
        ) : (
          <ul className="rows">
            {list.map((g) => {
              const target = Number(g.target_amount);
              const current = Number(g.current_amount);
              const remaining = round2(Math.max(0, target - current));

              const monthsLeft = g.target_date
                ? monthsUntil(g.target_date, now)
                : null;
              const perMonth =
                monthsLeft !== null && remaining > 0
                  ? round2(remaining / monthsLeft)
                  : null;

              return (
                <GoalRow
                  key={g.id}
                  id={g.id}
                  name={g.name}
                  targetAmount={target}
                  currentAmount={current}
                  targetDate={g.target_date}
                  formattedCurrent={money(current, g.currency)}
                  formattedTarget={money(target, g.currency)}
                  formattedRemaining={money(remaining, g.currency)}
                  formattedPerMonth={
                    perMonth === null ? null : money(perMonth, g.currency)
                  }
                  monthsLeft={monthsLeft}
                />
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
