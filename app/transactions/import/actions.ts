"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getRate } from "@/lib/rates";
import { CURRENCIES } from "@/lib/currencies";
import {
  detectDelimiter,
  normalizeDate,
  parseAmount,
  parseCsv,
} from "@/lib/csv";

const MAX_BYTES = 1_000_000;
const MAX_ROWS = 2000;

export type Mapping = {
  date: number;
  type: number;
  category: number;
  amount: number;
  currency: number;
  rate: number;
  note: number;
};

export type ParseState = {
  error: string | null;
  headers: string[] | null;
  rows: string[][] | null;
  guess: Mapping | null;
};

export type ImportState = {
  error: string | null;
  inserted: number;
  skipped: string[];
};

const HINTS: Record<keyof Mapping, string[]> = {
  date: ["date", "tarih", "day"],
  type: ["type", "tür", "tur", "islem", "işlem"],
  category: ["category", "kategori"],
  amount: ["amount", "tutar", "miktar", "value"],
  currency: ["currency", "para", "birim", "doviz", "döviz"],
  rate: ["rate", "kur"],
  note: ["note", "not", "description", "açıklama", "aciklama", "memo"],
};

function guessMapping(headers: string[]): Mapping {
  const lower = headers.map((h) => h.trim().toLowerCase());
  const find = (key: keyof Mapping) => {
    const hints = HINTS[key];
    for (let i = 0; i < lower.length; i++) {
      if (hints.some((hint) => lower[i].includes(hint))) return i;
    }
    return -1;
  };

  return {
    date: find("date"),
    type: find("type"),
    category: find("category"),
    amount: find("amount"),
    currency: find("currency"),
    rate: find("rate"),
    note: find("note"),
  };
}

export async function parseUpload(
  _prevState: ParseState,
  formData: FormData,
): Promise<ParseState> {
  const empty = { headers: null, rows: null, guess: null };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file first.", ...empty };
  }
  if (file.size > MAX_BYTES) {
    return { error: "That file is larger than 1 MB.", ...empty };
  }

  const text = await file.text();
  const table = parseCsv(text, detectDelimiter(text));

  if (table.length < 2) {
    return {
      error: "That file has no data rows under its header.",
      ...empty,
    };
  }

  const headers = table[0].map((h) => h.trim());
  const rows = table.slice(1, MAX_ROWS + 1);

  return {
    error:
      table.length - 1 > MAX_ROWS
        ? `Only the first ${MAX_ROWS} rows will be imported.`
        : null,
    headers,
    rows,
    guess: guessMapping(headers),
  };
}

function readMapping(formData: FormData): Mapping {
  const num = (key: string) => Number(formData.get(key) ?? -1);
  return {
    date: num("map_date"),
    type: num("map_type"),
    category: num("map_category"),
    amount: num("map_amount"),
    currency: num("map_currency"),
    rate: num("map_rate"),
    note: num("map_note"),
  };
}

export async function commitImport(
  _prevState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", inserted: 0, skipped: [] };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("base_currency")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: "Could not read your profile settings.",
      inserted: 0,
      skipped: [],
    };
  }

  const baseCurrency: string = profile.base_currency;

  let rows: string[][];
  try {
    const parsed: unknown = JSON.parse(String(formData.get("rows") ?? "[]"));
    if (!Array.isArray(parsed)) throw new Error("bad payload");
    rows = parsed as string[][];
  } catch {
    return {
      error: "Could not read the parsed rows.",
      inserted: 0,
      skipped: [],
    };
  }

  if (rows.length === 0) {
    return { error: "Nothing to import.", inserted: 0, skipped: [] };
  }

  const map = readMapping(formData);
  if (map.date < 0 || map.amount < 0) {
    return {
      error: "Map at least the date and amount columns.",
      inserted: 0,
      skipped: [],
    };
  }

  const createMissing = formData.get("create_missing") !== null;

  const { data: existing, error: catError } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("user_id", user.id);

  if (catError) {
    return {
      error: "Could not read your categories.",
      inserted: 0,
      skipped: [],
    };
  }

  const byName = new Map<string, { id: string; type: string }>();
  for (const c of existing ?? []) {
    byName.set(String(c.name).trim().toLowerCase(), {
      id: c.id as string,
      type: c.type as string,
    });
  }

  const cell = (row: string[], index: number) =>
    index >= 0 && index < row.length ? row[index].trim() : "";

  type Draft = {
    date: string;
    type: string;
    amount: number;
    currency: string;
    rate: number | null;
    note: string | null;
    categoryName: string;
  };

  const drafts: Draft[] = [];
  const skipped: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 2;

    const date = normalizeDate(cell(row, map.date));
    if (!date) {
      skipped.push(`Row ${line}: unreadable date.`);
      continue;
    }

    const rawAmount = parseAmount(cell(row, map.amount));
    if (rawAmount === null || rawAmount === 0) {
      skipped.push(`Row ${line}: unreadable amount.`);
      continue;
    }

    const rawType = cell(row, map.type).toLowerCase();
    let type: string;
    if (rawType.startsWith("in") || rawType.startsWith("gel")) type = "income";
    else if (rawType.startsWith("ex") || rawType.startsWith("gid"))
      type = "expense";
    else type = rawAmount < 0 ? "expense" : "income";

    const amount = Math.abs(rawAmount);

    let currency = cell(row, map.currency).toUpperCase();
    if (currency === "") currency = baseCurrency;
    if (!(CURRENCIES as readonly string[]).includes(currency)) {
      skipped.push(`Row ${line}: currency "${currency}" is not supported.`);
      continue;
    }

    const rawRate = map.rate >= 0 ? parseAmount(cell(row, map.rate)) : null;
    const rate = rawRate !== null && rawRate > 0 ? rawRate : null;

    const note = cell(row, map.note);

    drafts.push({
      date,
      type,
      amount,
      currency,
      rate,
      note: note === "" ? null : note,
      categoryName: cell(row, map.category),
    });
  }

  if (drafts.length === 0) {
    return { error: "No usable rows in that file.", inserted: 0, skipped };
  }

  if (createMissing) {
    const wanted = new Map<string, string>();
    for (const d of drafts) {
      const key = d.categoryName.trim().toLowerCase();
      if (key === "" || byName.has(key)) continue;
      wanted.set(key, d.categoryName.trim());
    }

    if (wanted.size > 0) {
      const inserts = [...wanted.entries()].map(([key, name]) => ({
        user_id: user.id,
        name,
        type: drafts.find((d) => d.categoryName.trim().toLowerCase() === key)!
          .type,
      }));

      const { data: created, error: createError } = await supabase
        .from("categories")
        .insert(inserts)
        .select("id, name, type");

      if (createError) {
        return {
          error: `Could not create the missing categories: ${createError.message}`,
          inserted: 0,
          skipped,
        };
      }

      for (const c of created ?? []) {
        byName.set(String(c.name).trim().toLowerCase(), {
          id: c.id as string,
          type: c.type as string,
        });
      }
    }
  }

  const rateCache = new Map<string, number>();
  const payload: Record<string, unknown>[] = [];

  for (const d of drafts) {
    let rate = d.rate;
    if (rate === null) {
      const key = `${d.currency}|${d.date}`;
      const cached = rateCache.get(key);
      if (cached !== undefined) {
        rate = cached;
      } else {
        try {
          rate = await getRate(d.currency, baseCurrency, d.date);
          rateCache.set(key, rate);
        } catch {
          skipped.push(
            `${d.date}: no exchange rate for ${d.currency}→${baseCurrency}.`,
          );
          continue;
        }
      }
    }

    const key = d.categoryName.trim().toLowerCase();
    const match = key === "" ? undefined : byName.get(key);
    const categoryId = match && match.type === d.type ? match.id : null;

    payload.push({
      user_id: user.id,
      category_id: categoryId,
      amount: d.amount,
      currency: d.currency,
      rate_to_base: rate,
      amount_base: Math.round(d.amount * rate * 100) / 100,
      type: d.type,
      date: d.date,
      note: d.note,
    });
  }

  if (payload.length === 0) {
    return { error: "No rows could be converted.", inserted: 0, skipped };
  }

  const { error } = await supabase.from("transactions").insert(payload);
  if (error) return { error: error.message, inserted: 0, skipped };

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return { error: null, inserted: payload.length, skipped };
}
