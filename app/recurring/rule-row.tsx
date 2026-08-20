"use client";

import { useActionState, useState } from "react";
import { DeleteButton } from "@/components/delete-button";
import {
  deleteRule,
  toggleRule,
  updateRule,
  type RecurringState,
} from "./actions";
import { RuleFields, type Category } from "./rule-fields";
import type { Rule } from "@/lib/recurring-server";

type Props = {
  rule: Rule;
  categories: Category[];
  categoryName: string | null;
  formattedAmount: string;
  nextDate: string | null;
  dueCount: number;
};

const initialState: RecurringState = { error: null, success: false };

export function RuleRow({
  rule,
  categories,
  categoryName,
  formattedAmount,
  nextDate,
  dueCount,
}: Props) {
  const [editing, setEditing] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (prev: RecurringState, formData: FormData) => {
      const result = await updateRule(prev, formData);
      if (result.success) setEditing(false);
      return result;
    },
    initialState,
  );

  if (editing) {
    return (
      <li className="row" style={{ display: "block" }}>
        <form action={formAction} className="editing space-y-3">
          <input type="hidden" name="id" value={rule.id} />

          <div className="form-grid">
            <RuleFields
              idPrefix={`edit-${rule.id}`}
              categories={categories}
              defaultName={rule.name}
              defaultAmount={rule.amount}
              defaultCurrency={rule.currency}
              defaultType={rule.type}
              defaultDay={rule.day_of_month}
              defaultStart={rule.start_date}
              defaultEnd={rule.end_date}
              defaultCategoryId={rule.category_id}
            />
          </div>

          <div className="flex gap-2">
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
          </div>

          {state.error && (
            <p className="msg msg-error" role="status">
              {state.error}
            </p>
          )}
        </form>
      </li>
    );
  }

  const isIncome = rule.type === "income";

  return (
    <li className="row">
      <span
        className="tile"
        aria-hidden
        style={{ background: "var(--card-2)", color: "var(--ink-3)" }}
      >
        ↻
      </span>

      <div className="row-main">
        <p className="row-title">
          {rule.name}
          {!rule.active && (
            <span className="chip" style={{ marginLeft: "0.5rem" }}>
              paused
            </span>
          )}
          {dueCount > 0 && rule.active && (
            <span className="pill pill-neg" style={{ marginLeft: "0.5rem" }}>
              {dueCount} due
            </span>
          )}
        </p>
        <p className="row-meta">
          Day {rule.day_of_month} · {categoryName ?? "No category"}
          {nextDate ? ` · next ${nextDate}` : " · finished"}
          {rule.end_date ? ` · until ${rule.end_date}` : ""}
        </p>
      </div>

      <span className={isIncome ? "num num-pos" : "num num-neg"}>
        {isIncome ? "+" : "−"}
        {formattedAmount}
      </span>

      <form action={toggleRule}>
        <input type="hidden" name="id" value={rule.id} />
        <input
          type="hidden"
          name="active"
          value={rule.active ? "false" : "true"}
        />
        <button type="submit" className="btn btn-ghost btn-sm">
          {rule.active ? "Pause" : "Resume"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="btn btn-ghost btn-sm"
        aria-label={`Edit ${rule.name}`}
      >
        Edit
      </button>

      <DeleteButton action={deleteRule} id={rule.id} label={rule.name} />
    </li>
  );
}
