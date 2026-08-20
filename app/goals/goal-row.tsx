"use client";

import { useActionState, useRef } from "react";
import { DeleteButton } from "@/components/delete-button";
import { contributeToGoal, deleteGoal, type GoalState } from "./actions";

type Props = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  formattedCurrent: string;
  formattedTarget: string;
  formattedRemaining: string;
  formattedPerMonth: string | null;
  monthsLeft: number | null;
};

const initialState: GoalState = { error: null, success: false };

export function GoalRow({
  id,
  name,
  targetAmount,
  currentAmount,
  targetDate,
  formattedCurrent,
  formattedTarget,
  formattedRemaining,
  formattedPerMonth,
  monthsLeft,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (prev: GoalState, formData: FormData) => {
      const result = await contributeToGoal(prev, formData);
      if (result.success) formRef.current?.reset();
      return result;
    },
    initialState,
  );

  const ratio = targetAmount > 0 ? currentAmount / targetAmount : 0;
  const percent = Math.min(100, Math.round(ratio * 100));
  const done = currentAmount >= targetAmount;

  return (
    <li className="row" style={{ display: "block" }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 py-1">
        <span className="row-title">{name}</span>
        <span className="num">
          {formattedCurrent}
          <span className="row-meta"> / {formattedTarget}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="bar"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${name} progress`}
        >
          <div
            className={`bar-fill ${done ? "bar-done" : "bar-ok"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="num row-meta">{percent}%</span>
      </div>

      <p className="row-meta py-1">
        {done ? (
          <span style={{ color: "var(--pos)" }}>Reached.</span>
        ) : (
          <>
            <span className="num">{formattedRemaining}</span> left
            {targetDate && monthsLeft !== null && formattedPerMonth && (
              <>
                {" · "}
                <span className="num">{formattedPerMonth}</span>/month for{" "}
                {monthsLeft} month{monthsLeft === 1 ? "" : "s"} (by{" "}
                <span className="num">{targetDate}</span>)
              </>
            )}
            {targetDate && monthsLeft === null && (
              <>
                {" · "}target date passed (
                <span className="num">{targetDate}</span>)
              </>
            )}
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-2 pb-1">
        <form ref={formRef} action={formAction} className="flex gap-2">
          <input type="hidden" name="id" value={id} />
          <label htmlFor={`delta-${id}`} className="sr-only">
            Amount to add to {name}
          </label>
          <input
            id={`delta-${id}`}
            name="delta"
            type="number"
            step="0.01"
            placeholder="Add / remove"
            className="input"
            style={{ width: "8rem" }}
          />
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-secondary btn-sm"
          >
            {isPending ? "…" : "Apply"}
          </button>
        </form>

        <DeleteButton action={deleteGoal} id={id} label={name} />
      </div>

      {state.error && (
        <p className="msg msg-error" role="status">
          {state.error}
        </p>
      )}
    </li>
  );
}
