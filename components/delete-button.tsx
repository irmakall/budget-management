"use client";

import { useState } from "react";

type Props = {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label: string;
};

export function DeleteButton({ action, id, label }: Props) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="btn btn-ghost btn-danger btn-sm"
        aria-label={`Delete ${label}`}
      >
        Delete
      </button>
    );
  }

  return (
    <form action={action} className="confirm">
      <input type="hidden" name="id" value={id} />
      <span>Delete?</span>
      <button
        type="submit"
        className="btn btn-ghost btn-danger btn-sm"
        aria-label={`Confirm deleting ${label}`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="btn btn-ghost btn-sm"
        aria-label={`Keep ${label}`}
      >
        No
      </button>
    </form>
  );
}
