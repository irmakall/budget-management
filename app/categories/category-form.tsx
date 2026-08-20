"use client";

import { useActionState, useRef } from "react";
import { createCategory, type CategoryState } from "./actions";
import { CategoryFields } from "./category-fields";

const initialState: CategoryState = { error: null, success: false };

export function CategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (prev: CategoryState, formData: FormData) => {
      const result = await createCategory(prev, formData);
      if (result.success) formRef.current?.reset();
      return result;
    },
    initialState,
  );

  return (
    <form ref={formRef} action={formAction} className="card card-pad space-y-3">
      <div className="form-grid">
        <CategoryFields idPrefix="new" />

        <div className="field" style={{ flex: "0 1 8rem" }}>
          <label htmlFor="new-type" className="label">
            Type
          </label>
          <select
            id="new-type"
            name="type"
            defaultValue="expense"
            required
            className="select"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary"
          style={{ flex: "0 0 auto" }}
        >
          {isPending ? "Adding…" : "Add category"}
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
