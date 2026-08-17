"use client";

import { useActionState } from "react";
import type { AuthState } from "@/app/auth/actions";

type AuthAction = (state: AuthState, formData: FormData) => Promise<AuthState>;

type Props = {
  title: string;
  submitLabel: string;
  pendingLabel: string;
  action: AuthAction;
  passwordAutoComplete: "new-password" | "current-password";
};

const initialState: AuthState = { error: null };

export function AuthForm({
  title,
  submitLabel,
  pendingLabel,
  action,
  passwordAutoComplete,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 p-6"
      >
        <h1 className="text-xl font-semibold">{title}</h1>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-gray-600">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-gray-600">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={passwordAutoComplete}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {state.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-black py-2 text-sm text-white disabled:opacity-50"
        >
          {isPending ? pendingLabel : submitLabel}
        </button>
      </form>
    </main>
  );
}
