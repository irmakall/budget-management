import { createClient } from "@/lib/supabase/server";
import { signOut } from "../auth/actions";
import { redirect } from "next/navigation";
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

  if (error) {
    return <p>There is an error</p>;
  }

  return (
    <>
      <SettingsForm
        key={`${profile.base_currency}-${profile.month_start_day}`}
        baseCurrency={profile.base_currency}
        monthStartDay={profile.month_start_day}
      />
      <form action={signOut}>
        <button>Log out</button>
      </form>
    </>
  );
}
