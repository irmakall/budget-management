"use client";

import { useActionState, useRef, useState } from "react";
import { createTransaction, type TransactionState } from "./actions";
import { CurrencyOptions } from "@/components/currency-options";

type Category = { id: string; name: string; type: string };
type Props = { categories: Category[]; bare?: boolean };

const initialState: TransactionState = { error: null, success: false };

function today() {
  return new Date().toLocaleDateString("en-CA");
}

export function TransactionForm({ categories, bare = false }: Props) {
  const [type, setType] = useState("expense");
  const [categoryId, setCategoryId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (prev: TransactionState, formData: FormData) => {
      const result = await createTransaction(prev, formData);
      if (result.success) {
        formRef.current?.reset();
        setCategoryId("");
      }
      return result;
    },
    initialState,
  );

  const visibleCategories = categories.filter((c) => c.type === type);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={bare ? "space-y-3" : "card card-pad space-y-3"}
    >
      <div className="form-grid">
        <div className="field" style={{ flex: "0 1 8rem" }}>
          <label htmlFor="amount" className="label">
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className="input"
          />
        </div>

        <div className="field" style={{ flex: "0 1 6rem" }}>
          <label htmlFor="currency" className="label">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            defaultValue="TRY"
            required
            className="select"
          >
            <CurrencyOptions />
          </select>
        </div>

        <div className="field" style={{ flex: "0 1 8rem" }}>
          <label htmlFor="type" className="label">
            Type
          </label>
          <select
            id="type"
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
          <label htmlFor="category_id" className="label">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            value={categoryId}
            className="select"
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">No category</option>
            {visibleCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field" style={{ flex: "0 1 9.5rem" }}>
          <label htmlFor="date" className="label">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={today()}
            required
            className="input"
          />
        </div>

        <div className="field" style={{ flex: "1 1 10rem" }}>
          <label htmlFor="note" className="label">
            Note
          </label>
          <input
            id="note"
            name="note"
            type="text"
            placeholder="Optional"
            className="input"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary"
          style={{ flex: "0 0 auto" }}
        >
          {isPending ? "Saving…" : "Add"}
        </button>
      </div>

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
    </form>
  );
}
