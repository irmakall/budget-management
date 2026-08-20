import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full" style={{ maxWidth: "30rem" }}>
        <p className="wordmark mb-8 block" style={{ fontSize: "1.125rem" }}>
          Para Takip
        </p>

        <section className="hero-card mb-6">
          <p className="hero-label">Every lira, in one place</p>
          <p className="hero-value">₺ $ €</p>
        </section>

        <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>
          Track what you spend, in any currency.
        </h1>

        <p className="note" style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}>
          Each entry freezes the day&apos;s exchange rate, so last month&apos;s
          report never changes. Periods run from the 6th to the 5th — or
          whichever day you pick.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/signup" className="btn btn-primary">
            Create an account
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
