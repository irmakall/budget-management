"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type ResetState } from "@/app/auth/actions";

const initialState: ResetState = { error: null, sent: false };

export function ForgotForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full" style={{ maxWidth: "22rem" }}>
        <p className="wordmark mb-6 block">Para&nbsp;Takip</p>

        <form action={formAction} className="card card-pad space-y-4">
          <h1 className="page-title">Reset your password</h1>

          {state.sent ? (
            <p className="msg msg-ok" role="status">
              If that address has an account, a reset link is on its way. The
              link works once and expires.
            </p>
          ) : (
            <>
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
                {isPending ? "Sending…" : "Send the link"}
              </button>
            </>
          )}
        </form>

        <p className="note mt-4 text-center">
          Remembered it?{" "}
          <Link
            href="/login"
            style={{ color: "var(--primary)", fontWeight: 600 }}
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
