import { createClient } from "@/lib/supabase/server";
import { getPeriod, getPeriodRange, today } from "@/lib/period";
import { toCsv } from "@/lib/csv";

type Row = {
  date: string;
  type: string;
  amount: number;
  currency: string;
  rate_to_base: number;
  amount_base: number;
  note: string | null;
  categories: { name: string } | null;
};

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Not authenticated", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("base_currency, month_start_day")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return new Response("Could not read your profile settings.", {
      status: 500,
    });
  }

  const url = new URL(request.url);
  const startDay: number = profile.month_start_day;
  const periodParam = url.searchParams.get("period");
  const all = url.searchParams.get("all") === "1";

  const period =
    periodParam && /^\d{4}-\d{2}$/.test(periodParam)
      ? periodParam
      : getPeriod(today(), startDay);

  let query = supabase
    .from("transactions")
    .select(
      "date, type, amount, currency, rate_to_base, amount_base, note, categories(name)",
    )
    .eq("user_id", user.id);

  if (!all) {
    const { start, end } = getPeriodRange(period, startDay);
    query = query.gte("date", start).lte("date", end);
  }

  const search = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (search !== "") query = query.ilike("note", `%${search}%`);

  const typeFilter = url.searchParams.get("type");
  if (typeFilter === "income" || typeFilter === "expense") {
    query = query.eq("type", typeFilter);
  }

  const categoryFilter = url.searchParams.get("category");
  if (categoryFilter === "none") query = query.is("category_id", null);
  else if (categoryFilter) query = query.eq("category_id", categoryFilter);

  const { data, error } = await query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return new Response("Could not export transactions.", { status: 500 });
  }

  const rows = (data ?? []) as unknown as Row[];

  const csv = toCsv(
    [
      "date",
      "type",
      "category",
      "amount",
      "currency",
      "rate_to_base",
      `amount_${profile.base_currency.toLowerCase()}`,
      "note",
    ],
    rows.map((r) => [
      r.date,
      r.type,
      r.categories?.name ?? "",
      r.amount,
      r.currency,
      r.rate_to_base,
      r.amount_base,
      r.note ?? "",
    ]),
  );

  const filename = all ? "para-takip-all.csv" : `para-takip-${period}.csv`;

  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
