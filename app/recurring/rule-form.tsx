"use client";

import { useActionState, useRef } from "react";
import { createRule, type RecurringState } from "./actions";
import { RuleFields, type Category } from "./rule-fields";

const initialState: RecurringState = { error: null, success: false };

type Props = {
  categories: Category[];
  defaultCurrency: string;
  todayIso: string;
};

export function RuleForm({ categories, defaultCurrency, todayIso }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (prev: RecurringState, formData: FormData) => {
      const result = await createRule(prev, formData);
      if (result.success) formRef.current?.reset();
      return result;
    },
    initialState,
  );

  return (
    <form ref={formRef} action={formAction} className="card card-pad space-y-3">
      <div className="form-grid">
        <RuleFields
          idPrefix="new-rule"
          categories={categories}
          defaultCurrency={defaultCurrency}
          defaultStart={todayIso}
        />

        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary"
          style={{ flex: "0 0 auto" }}
        >
          {isPending ? "Adding…" : "Add rule"}
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
