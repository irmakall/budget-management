"use client";

import { useActionState } from "react";
import { updateProfile, type SettingsState } from "./actions";
import { useState } from "react";

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
    <form className="space-y-3" action={formAction}>
      <label htmlFor="base_currency">Currency</label>
      <select
        id="base_currency"
        name="base_currency"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
      >
        <option value="TRY">TRY</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
      </select>

      <label htmlFor="month_start_day">Month starts on day</label>
      <input
        id="month_start_day"
        type="number"
        name="month_start_day"
        value={day}
        onChange={(e) => setDay(Number(e.target.value))}
        min={1}
        max={28}
      />

      {state.error && <p style={{ color: "red" }}>{state.error}</p>}
      {state.success && (
        <p style={{ color: "green" }}>Settings saved successfully!</p>
      )}
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
