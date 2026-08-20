"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string | null };

export async function signUp(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (error) return { error: error.message };

  redirect("/dashboard");
}
export async function signIn(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type ResetState = { error: string | null; sent: boolean };

export async function requestPasswordReset(
  _prevState: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Enter a valid email address.", sent: false };
  }

  const supabase = await createClient();

  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    (headerList.get("host")
      ? `https://${headerList.get("host")}`
      : "http://localhost:3000");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message, sent: false };

  return { error: null, sent: true };
}

export type PasswordState = { error: string | null; success: boolean };

export async function updatePassword(
  _prevState: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    return { error: "Use at least 6 characters.", success: false };
  }
  if (password !== String(formData.get("confirm") ?? "")) {
    return { error: "The two passwords do not match.", success: false };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "This reset link has expired. Request a new one.",
      success: false,
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message, success: false };

  return { error: null, success: true };
}
