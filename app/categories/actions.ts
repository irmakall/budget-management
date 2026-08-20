"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { COLORS, ICONS, TYPES } from "./constants";

export type CategoryState = { error: string | null; success: boolean };

const MAX_NAME = 40;

type Fields = {
  name: string;
  icon: string | null;
  color: string | null;
};

type Parsed = { ok: false; error: string } | { ok: true; fields: Fields };

function readFields(formData: FormData): Parsed {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length === 0) return { ok: false, error: "Name is required." };
  if (name.length > MAX_NAME) {
    return {
      ok: false,
      error: `Name must be at most ${MAX_NAME} characters.`,
    };
  }

  const icon = String(formData.get("icon") ?? "");
  if (icon !== "" && !ICONS.includes(icon as (typeof ICONS)[number])) {
    return { ok: false, error: "Invalid icon." };
  }

  const color = String(formData.get("color") ?? "");
  if (color !== "" && !COLORS.includes(color as (typeof COLORS)[number])) {
    return { ok: false, error: "Invalid color." };
  }

  return {
    ok: true,
    fields: {
      name,
      icon: icon === "" ? null : icon,
      color: color === "" ? null : color,
    },
  };
}

function friendlyError(code: string | undefined, message: string) {
  if (code === "23505") return "You already have a category with that name.";
  return message;
}

export async function createCategory(
  _prevState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", success: false };

  const parsed = readFields(formData);
  if (!parsed.ok) return { error: parsed.error, success: false };

  const type = String(formData.get("type") ?? "");
  if (!TYPES.includes(type as (typeof TYPES)[number])) {
    return { error: "Select a valid type.", success: false };
  }

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    type,
    ...parsed.fields,
  });

  if (error) {
    return { error: friendlyError(error.code, error.message), success: false };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  return { error: null, success: true };
}

export async function updateCategory(
  _prevState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", success: false };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing category id.", success: false };

  const parsed = readFields(formData);
  if (!parsed.ok) return { error: parsed.error, success: false };

  const { data, error } = await supabase
    .from("categories")
    .update(parsed.fields)
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) {
    return { error: friendlyError(error.code, error.message), success: false };
  }
  if (!data || data.length === 0) {
    return { error: "Category not found.", success: false };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  return { error: null, success: true };
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) {
    console.error("Category delete failed:", error);
  } else if (!data || data.length === 0) {
    console.warn("Category delete affected no rows:", id);
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
}
