"use client";

import { useState } from "react";
import { CurrencyOptions } from "@/components/currency-options";

export type Category = { id: string; name: string; type: string };

type Props = {
  idPrefix: string;
  categories: Category[];
  defaultName?: string;
  defaultAmount?: number | string;
  defaultCurrency: string;
  defaultType?: string;
  defaultDay?: number;
  defaultStart: string;
  defaultEnd?: string | null;
  defaultCategoryId?: string | null;
};

export function RuleFields({
  idPrefix,
  categories,
  defaultName = "",
  defaultAmount = "",
  defaultCurrency,
  defaultType = "expense",
  defaultDay = 1,
  defaultStart,
  defaultEnd = null,
  defaultCategoryId = null,
}: Props) {
  const [type, setType] = useState(defaultType);
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? "");

  const visible = categories.filter((c) => c.type === type);

  return (
    <>
      <div className="field" style={{ flex: "1 1 11rem" }}>
        <label htmlFor={`${idPrefix}-name`} className="label">
          Name
        </label>
        <input
          id={`${idPrefix}-name`}
          name="name"
          type="text"
          maxLength={60}
          required
          defaultValue={defaultName}
          placeholder="Rent"
          className="input"
        />
      </div>

      <div className="field" style={{ flex: "0 1 8rem" }}>
        <label htmlFor={`${idPrefix}-amount`} className="label">
          Amount
        </label>
        <input
          id={`${idPrefix}-amount`}
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={defaultAmount}
          placeholder="0.00"
          className="input"
        />
      </div>

      <div className="field" style={{ flex: "0 1 6rem" }}>
        <label htmlFor={`${idPrefix}-currency`} className="label">
          Currency
        </label>
        <select
          id={`${idPrefix}-currency`}
          name="currency"
          defaultValue={defaultCurrency}
          required
          className="select"
        >
          <CurrencyOptions />
        </select>
      </div>

      <div className="field" style={{ flex: "0 1 8rem" }}>
        <label htmlFor={`${idPrefix}-type`} className="label">
          Type
        </label>
        <select
          id={`${idPrefix}-type`}
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
        <label htmlFor={`${idPrefix}-category`} className="label">
          Category
        </label>
        <select
          id={`${idPrefix}-category`}
          name="category_id"
          value={categoryId}
          className="select"
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">No category</option>
          {visible.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field" style={{ flex: "0 1 7rem" }}>
        <label htmlFor={`${idPrefix}-day`} className="label">
          Day of month
        </label>
        <input
          id={`${idPrefix}-day`}
          name="day_of_month"
          type="number"
          min={1}
          max={28}
          required
          defaultValue={defaultDay}
          className="input"
        />
      </div>

      <div className="field" style={{ flex: "0 1 9.5rem" }}>
        <label htmlFor={`${idPrefix}-start`} className="label">
          Starts
        </label>
        <input
          id={`${idPrefix}-start`}
          name="start_date"
          type="date"
          required
          defaultValue={defaultStart}
          className="input"
        />
      </div>

      <div className="field" style={{ flex: "0 1 9.5rem" }}>
        <label htmlFor={`${idPrefix}-end`} className="label">
          Ends (optional)
        </label>
        <input
          id={`${idPrefix}-end`}
          name="end_date"
          type="date"
          defaultValue={defaultEnd ?? ""}
          className="input"
        />
      </div>
    </>
  );
}
