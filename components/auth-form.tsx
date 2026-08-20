"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/app/auth/actions";

type AuthAction = (state: AuthState, formData: FormData) => Promise<AuthState>;

type Props = {
  title: string;
  submitLabel: string;
  pendingLabel: string;
  action: AuthAction;
  passwordAutoComplete: "new-password" | "current-password";
  altPrompt: string;
  altHref: string;
  altLabel: string;
  helpHref?: string;
  helpLabel?: string;
};

const initialState: AuthState = { error: null };

export function AuthForm({
  title,
  submitLabel,
  pendingLabel,
  action,
  passwordAutoComplete,
  altPrompt,
  altHref,
  altLabel,
  helpHref,
  helpLabel,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full" style={{ maxWidth: "22rem" }}>
        <p className="wordmark mb-6 block">Para&nbsp;Takip</p>

        <form action={formAction} className="card card-pad space-y-4">
          <h1 className="page-title">{title}</h1>

          <div className="field">
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input"
            />
          </div>

          <div className="field">
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={passwordAutoComplete}
              className="input"
            />
            <span className="note">At least 6 characters.</span>
          </div>

          {state.error && (
            <p className="msg msg-error" role="status">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary w-full"
          >
            {isPending ? pendingLabel : submitLabel}
          </button>
        </form>

        {helpHref && helpLabel && (
          <p className="note mt-4 text-center">
            <Link
              href={helpHref}
              style={{ color: "var(--primary)", fontWeight: 600 }}
            >
              {helpLabel}
            </Link>
          </p>
        )}

        <p className="note mt-2 text-center">
          {altPrompt}{" "}
          <Link
            href={altHref}
            style={{ color: "var(--primary)", fontWeight: 600 }}
          >
            {altLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
