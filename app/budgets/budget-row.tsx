"use client";

import { useActionState } from "react";
import { setBudget, type BudgetState } from "./actions";
import { COLOR_TINTS, DEFAULT_TINT } from "@/app/categories/constants";

type Props = {
  categoryId: string;
  categoryName: string;
  icon: string | null;
  color: string | null;
  period: string;
  limit: number | null;
  spent: number;
  formattedSpent: string;
  formattedLimit: string | null;
};

const initialState: BudgetState = { error: null, success: false };

export function BudgetRow({
  categoryId,
  categoryName,
  icon,
  color,
  period,
  limit,
  spent,
  formattedSpent,
  formattedLimit,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    setBudget,
    initialState,
  );

  const ratio = limit && limit > 0 ? spent / limit : 0;
  const percent = Math.min(100, Math.round(ratio * 100));
  const barClass =
    ratio >= 1 ? "bar-over" : ratio >= 0.8 ? "bar-warn" : "bar-ok";
  const tint = color ? (COLOR_TINTS[color] ?? DEFAULT_TINT) : DEFAULT_TINT;

  return (
    <li className="row" style={{ display: "block" }}>
      <div className="flex flex-wrap items-center gap-3 py-1">
        <span
          className="tile"
          aria-hidden
          style={{ background: tint, color: color ?? "var(--ink-3)" }}
        >
          {icon ?? "•"}
        </span>

        <span className="row-main row-title">{categoryName}</span>

        <span className={limit === null ? "num row-meta" : "num"}>
          {formattedSpent}
          {formattedLimit && (
            <span className="row-meta" style={{ fontWeight: 500 }}>
              {" "}
              / {formattedLimit}
            </span>
          )}
        </span>

        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="category_id" value={categoryId} />
          <input type="hidden" name="period" value={period} />
          <label htmlFor={`limit-${categoryId}`} className="sr-only">
            Limit for {categoryName}
          </label>
          <input
            id={`limit-${categoryId}`}
            name="amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={limit ?? ""}
            placeholder="No limit"
            className="input"
            style={{ width: "7rem" }}
          />
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-secondary btn-sm"
          >
            {isPending ? "…" : "Set"}
          </button>
        </form>
      </div>

      {limit !== null && (
        <div className="flex items-center gap-3 pb-2">
          <div
            className="bar"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${categoryName} budget usage`}
          >
            <div
              className={`bar-fill ${barClass}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span
            className="num row-meta"
            style={{
              color:
                ratio >= 1
                  ? "var(--neg)"
                  : ratio >= 0.8
                    ? "var(--warn)"
                    : undefined,
            }}
          >
            {ratio >= 1 ? "over" : `${percent}%`}
          </span>
        </div>
      )}

      {state.error && (
        <p className="msg msg-error" role="status">
          {state.error}
        </p>
      )}
    </li>
  );
}
