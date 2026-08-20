"use client";

import { useActionState, useState } from "react";
import { DeleteButton } from "@/components/delete-button";
import { deleteCategory, updateCategory, type CategoryState } from "./actions";
import { CategoryFields } from "./category-fields";
import { COLOR_TINTS, DEFAULT_TINT } from "./constants";

export type Category = {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
};

type Props = {
  category: Category;
  total: number;
  formattedTotal: string;
};

const initialState: CategoryState = { error: null, success: false };

export function CategoryRow({ category, total, formattedTotal }: Props) {
  const [editing, setEditing] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (prev: CategoryState, formData: FormData) => {
      const result = await updateCategory(prev, formData);
      if (result.success) setEditing(false);
      return result;
    },
    initialState,
  );

  const tint = category.color
    ? (COLOR_TINTS[category.color] ?? DEFAULT_TINT)
    : DEFAULT_TINT;

  if (editing) {
    return (
      <li className="row" style={{ display: "block" }}>
        <form action={formAction} className="form-grid py-2">
          <input type="hidden" name="id" value={category.id} />
          <CategoryFields
            idPrefix={`edit-${category.id}`}
            defaultName={category.name}
            defaultIcon={category.icon}
            defaultColor={category.color}
          />

          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary btn-sm"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="btn btn-ghost btn-sm"
          >
            Cancel
          </button>
        </form>

        {state.error && (
          <p className="msg msg-error" role="status">
            {state.error}
          </p>
        )}
      </li>
    );
  }

  return (
    <li className="row">
      <span
        className="tile"
        aria-hidden
        style={{ background: tint, color: category.color ?? "var(--ink-3)" }}
      >
        {category.icon ?? "•"}
      </span>

      <span className="row-main row-title">{category.name}</span>

      <span className={total === 0 ? "num row-meta" : "num"}>
        {formattedTotal}
      </span>

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="btn btn-ghost btn-sm"
        aria-label={`Edit ${category.name}`}
      >
        Edit
      </button>

      <DeleteButton
        action={deleteCategory}
        id={category.id}
        label={category.name}
      />
    </li>
  );
}
