"use client";

import { useActionState, useRef } from "react";
import { createGoal, type GoalState } from "./actions";
import { CurrencyOptions } from "@/components/currency-options";

const initialState: GoalState = { error: null, success: false };

export function GoalForm({ defaultCurrency }: { defaultCurrency: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (prev: GoalState, formData: FormData) => {
      const result = await createGoal(prev, formData);
      if (result.success) formRef.current?.reset();
      return result;
    },
    initialState,
  );

  return (
    <form ref={formRef} action={formAction} className="card card-pad space-y-3">
      <div className="form-grid">
        <div className="field" style={{ flex: "1 1 12rem" }}>
          <label htmlFor="goal-name" className="label">
            Goal
          </label>
          <input
            id="goal-name"
            name="name"
            type="text"
            maxLength={60}
            required
            placeholder="Emergency fund"
            className="input"
          />
        </div>

        <div className="field" style={{ flex: "0 1 8rem" }}>
          <label htmlFor="goal-target" className="label">
            Target
          </label>
          <input
            id="goal-target"
            name="target_amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className="input"
          />
        </div>

        <div className="field" style={{ flex: "0 1 6rem" }}>
          <label htmlFor="goal-currency" className="label">
            Currency
          </label>
          <select
            id="goal-currency"
            name="currency"
            defaultValue={defaultCurrency}
            required
            className="select"
          >
            <CurrencyOptions />
          </select>
        </div>

        <div className="field" style={{ flex: "0 1 8rem" }}>
          <label htmlFor="goal-current" className="label">
            Already saved
          </label>
          <input
            id="goal-current"
            name="current_amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={0}
            className="input"
          />
        </div>

        <div className="field" style={{ flex: "0 1 9.5rem" }}>
          <label htmlFor="goal-date" className="label">
            Target date
          </label>
          <input
            id="goal-date"
            name="target_date"
            type="date"
            className="input"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary"
          style={{ flex: "0 0 auto" }}
        >
          {isPending ? "Adding…" : "Add goal"}
        </button>
      </div>

      {state.error && (
        <p className="msg msg-error" role="status">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="msg msg-ok" role="status">
          Added.
        </p>
      )}
    </form>
  );
}
