import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div
        className="card card-pad w-full space-y-4"
        style={{ maxWidth: "28rem" }}
      >
        <p className="wordmark">Para Takip</p>
        <h1 className="page-title">There is nothing at this address.</h1>
        <p className="note">
          The link may be old, or the page may have been renamed.
        </p>
        <Link href="/dashboard" className="btn btn-primary">
          Back to overview
        </Link>
      </div>
    </main>
  );
}
