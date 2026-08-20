"use client";

import { useActionState } from "react";
import { postDue, type PostState } from "./actions";

const initialState: PostState = { error: null, posted: 0, skipped: [] };

type Props = {
  count: number;
  preview: { key: string; label: string }[];
};

export function PostDue({ count, preview }: Props) {
  const [state, formAction, isPending] = useActionState(postDue, initialState);

  return (
    <form action={formAction} className="card card-pad space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="row-title">
            {count} entr{count === 1 ? "y" : "ies"} waiting to be posted
          </h2>
          <p className="note">
            Nothing is written to your transactions until you press the button.
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending || count === 0}
          className="btn btn-primary"
        >
          {isPending ? "Posting…" : `Post ${count}`}
        </button>
      </div>

      {preview.length > 0 && (
        <ul className="note space-y-1">
          {preview.map((p) => (
            <li key={p.key}>{p.label}</li>
          ))}
        </ul>
      )}

      {state.error && (
        <p className="msg msg-error" role="status">
          {state.error}
        </p>
      )}
      {state.posted > 0 && (
        <p className="msg msg-ok" role="status">
          Posted {state.posted} transaction{state.posted === 1 ? "" : "s"}.
        </p>
      )}
      {state.skipped.length > 0 && (
        <details>
          <summary className="details-summary">
            {state.skipped.length} skipped
          </summary>
          <ul className="note space-y-1 pt-2">
            {state.skipped.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </details>
      )}
    </form>
  );
}
