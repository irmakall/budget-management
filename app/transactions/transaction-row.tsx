"use client";

import { useActionState, useState } from "react";
import { CurrencyOptions } from "@/components/currency-options";
import { DeleteButton } from "@/components/delete-button";
import { COLOR_TINTS, DEFAULT_TINT } from "@/app/categories/constants";
import {
  deleteTransaction,
  updateTransaction,
  type TransactionState,
} from "./actions";

export type Category = { id: string; name: string; type: string };

export type Transaction = {
  id: string;
  amount: number;
  currency: string;
  amount_base: number;
  type: string;
  date: string;
  note: string | null;
  category_id: string | null;
  categories: {
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
};

type Props = {
  transaction: Transaction;
  categories: Category[];
  baseCurrency: string;
  formattedAmount: string;
  formattedBase: string;
};

const initialState: TransactionState = { error: null, success: false };

export function TransactionRow({
  transaction: t,
  categories,
  baseCurrency,
  formattedAmount,
  formattedBase,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState(t.type);
  const [categoryId, setCategoryId] = useState(t.category_id ?? "");

  const [state, formAction, isPending] = useActionState(
    async (prev: TransactionState, formData: FormData) => {
      const result = await updateTransaction(prev, formData);
      if (result.success) setEditing(false);
      return result;
    },
    initialState,
  );

  const isIncome = t.type === "income";
  const showBase = t.currency !== baseCurrency;
  const color = t.categories?.color ?? null;
  const tint = color ? (COLOR_TINTS[color] ?? DEFAULT_TINT) : DEFAULT_TINT;

  function startEditing() {
    setType(t.type);
    setCategoryId(t.category_id ?? "");
    setEditing(true);
  }

  if (editing) {
    const visibleCategories = categories.filter((c) => c.type === type);

    return (
      <li className="row" style={{ display: "block" }}>
        <form action={formAction} className="editing space-y-3">
          <input type="hidden" name="id" value={t.id} />

          <div className="form-grid">
            <div className="field" style={{ flex: "0 1 8rem" }}>
              <label htmlFor={`amount-${t.id}`} className="label">
                Amount
              </label>
              <input
                id={`amount-${t.id}`}
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={t.amount}
                className="input"
              />
            </div>

            <div className="field" style={{ flex: "0 1 6rem" }}>
              <label htmlFor={`currency-${t.id}`} className="label">
                Currency
              </label>
              <select
                id={`currency-${t.id}`}
                name="currency"
                defaultValue={t.currency}
                required
                className="select"
              >
                <CurrencyOptions />
              </select>
            </div>

            <div className="field" style={{ flex: "0 1 8rem" }}>
              <label htmlFor={`type-${t.id}`} className="label">
                Type
              </label>
              <select
                id={`type-${t.id}`}
                name="type"
                value={type}
                required
                className="select"
                onChange={(e) => {
                  setType(e.target.value);
                  setCategoryId("");
                }}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div className="field" style={{ flex: "1 1 10rem" }}>
              <label htmlFor={`category-${t.id}`} className="label">
                Category
              </label>
              <select
                id={`category-${t.id}`}
                name="category_id"
                value={categoryId}
                className="select"
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">No category</option>
                {visibleCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field" style={{ flex: "0 1 9.5rem" }}>
              <label htmlFor={`date-${t.id}`} className="label">
                Date
              </label>
              <input
                id={`date-${t.id}`}
                name="date"
                type="date"
                defaultValue={t.date}
                required
                className="input"
              />
            </div>

            <div className="field" style={{ flex: "1 1 10rem" }}>
              <label htmlFor={`note-${t.id}`} className="label">
                Note
              </label>
              <input
                id={`note-${t.id}`}
                name="note"
                type="text"
                defaultValue={t.note ?? ""}
                placeholder="Optional"
                className="input"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="note flex items-center gap-2">
              <input type="checkbox" name="refresh_rate" />
              Refresh the exchange rate for this date
            </label>

            <span className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="btn btn-primary btn-sm"
              >
                {isPending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            </span>
          </div>

          <p className="note">
            The rate frozen when this entry was recorded is kept unless you tick
            the box. Changing the currency always fetches a new rate.
          </p>

          {state.error && (
            <p className="msg msg-error" role="status">
              {state.error}
            </p>
          )}
        </form>
      </li>
    );
  }

  return (
    <li className="row">
      <span
        className="tile"
        aria-hidden
        style={{ background: tint, color: color ?? "var(--ink-3)" }}
      >
        {t.categories?.icon ?? (isIncome ? "↓" : "↑")}
      </span>

      <div className="row-main">
        <p className="row-title">{t.categories?.name ?? "Uncategorized"}</p>
        <p className="row-meta">
          {t.date}
          {t.note ? ` · ${t.note}` : ""}
        </p>
      </div>

      <div className="text-right">
        <p className={isIncome ? "num num-pos" : "num num-neg"}>
          {isIncome ? "+" : "−"}
          {formattedAmount}
        </p>
        {showBase && (
          <p className="num row-meta" style={{ fontWeight: 500 }}>
            {formattedBase}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={startEditing}
        className="btn btn-ghost btn-sm"
        aria-label={`Edit transaction from ${t.date}`}
      >
        Edit
      </button>

      <DeleteButton
        action={deleteTransaction}
        id={t.id}
        label={`transaction from ${t.date}`}
      />
    </li>
  );
}
