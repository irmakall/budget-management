"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div
        className="card card-pad w-full space-y-4"
        style={{ maxWidth: "28rem" }}
      >
        <h1 className="page-title">That did not load.</h1>

        <p className="note">
          Something failed on the way to this page. Your data is untouched —
          nothing was saved or deleted.
        </p>

        {error.digest && (
          <p className="note">
            Reference: <span className="num">{error.digest}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={retry} className="btn btn-primary">
            Try again
          </button>
          <Link href="/dashboard" className="btn btn-secondary">
            Back to overview
          </Link>
        </div>
      </div>
    </main>
  );
}
