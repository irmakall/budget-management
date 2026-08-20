"use client";

import { useActionState, useState } from "react";
import { updateProfile, type SettingsState } from "./actions";
import { CurrencyOptions } from "@/components/currency-options";

type Props = {
  baseCurrency: string;
  monthStartDay: number;
};

const initialState: SettingsState = { error: null, success: false };

export function SettingsForm({ baseCurrency, monthStartDay }: Props) {
  const [currency, setCurrency] = useState(baseCurrency);
  const [day, setDay] = useState(monthStartDay);

  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState,
  );

  return (
    <form action={formAction} className="card card-pad space-y-4">
      <div className="field">
        <label htmlFor="base_currency" className="label">
          Base currency
        </label>
        <select
          id="base_currency"
          name="base_currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="select"
        >
          <CurrencyOptions />
        </select>
        <span className="note">
          Every total on the site is shown in this currency.
        </span>
      </div>

      <div className="field">
        <label htmlFor="month_start_day" className="label">
          Period starts on day
        </label>
        <input
          id="month_start_day"
          type="number"
          name="month_start_day"
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
          min={1}
          max={28}
          className="input"
          style={{ width: "6rem" }}
        />
        <span className="note">
          Day {day} to day {day === 1 ? 31 : day - 1} of the next month. Capped
          at 28 so every month has that day.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className="btn btn-primary">
          {isPending ? "Saving…" : "Save"}
        </button>
        {state.error && (
          <p className="msg msg-error" role="status">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="msg msg-ok" role="status">
            Saved.
          </p>
        )}
      </div>
    </form>
  );
}
