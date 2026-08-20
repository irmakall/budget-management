import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/nav";
import { signOut } from "../auth/actions";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("base_currency, month_start_day")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return (
      <AppShell current="/settings" title="Settings">
        <p className="msg msg-error" role="status">
          Could not read your profile settings.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell current="/settings" title="Settings" meta={user.email}>
      <div className="grid">
        <section className="span-6 space-y-4">
          <SettingsForm
            key={`${profile.base_currency}-${profile.month_start_day}`}
            baseCurrency={profile.base_currency}
            monthStartDay={profile.month_start_day}
          />

          <p className="note">
            Changing your base currency does not re-convert past transactions —
            each one keeps the rate it was recorded with.
          </p>

          <form action={signOut}>
            <button type="submit" className="btn btn-secondary btn-sm">
              Log out
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
