"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePassword, type PasswordState } from "@/app/auth/actions";

const initialState: PasswordState = { error: null, success: false };

export function ResetForm() {
  const [state, formAction, isPending] = useActionState(
    updatePassword,
    initialState,
  );

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full" style={{ maxWidth: "22rem" }}>
        <p className="wordmark mb-6 block">Para&nbsp;Takip</p>

        <form action={formAction} className="card card-pad space-y-4">
          <h1 className="page-title">Pick a new password</h1>

          {state.success ? (
            <>
              <p className="msg msg-ok" role="status">
                Saved. You are logged in with the new password.
              </p>
              <Link href="/dashboard" className="btn btn-primary w-full">
                Go to overview
              </Link>
            </>
          ) : (
            <>
              <div className="field">
                <label htmlFor="password" className="label">
                  New password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="input"
                />
                <span className="note">At least 6 characters.</span>
              </div>

              <div className="field">
                <label htmlFor="confirm" className="label">
                  Repeat it
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="input"
                />
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
                {isPending ? "Saving…" : "Save password"}
              </button>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
