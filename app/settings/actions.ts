"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrency } from "@/lib/currencies";

export type SettingsState = { error: string | null; success: boolean };

export async function updateProfile(
  _prevState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", success: false };
  }

  const baseCurrency = String(formData.get("base_currency") ?? "");
  const monthStartDay = Number(formData.get("month_start_day"));
  if (!isCurrency(baseCurrency))
    return { error: "Select a valid currency.", success: false };
  if (
    !Number.isInteger(monthStartDay) ||
    monthStartDay < 1 ||
    monthStartDay > 28
  )
    return {
      error: "Month start day must be between 1 and 28.",
      success: false,
    };

  const { error } = await supabase
    .from("profiles")
    .update({ base_currency: baseCurrency, month_start_day: monthStartDay })
    .eq("id", user.id);

  if (error) return { error: error.message, success: false };

  revalidatePath("/settings");

  return { error: null, success: true };
}
