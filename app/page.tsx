// GECICI: Supabase baglantisini dogrulamak icin. Asama 1'de silecegiz.
async function checkSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return { ok: false, msg: ".env.local okunamadi" };

  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      cache: "no-store",
    });
    if (res.status === 401) return { ok: false, msg: "Anahtar gecersiz (401)" };
    if (!res.ok) return { ok: false, msg: `Beklenmeyen yanit: ${res.status}` };
    return { ok: true, msg: "Supabase baglantisi calisiyor" };
  } catch {
    return { ok: false, msg: "Adrese ulasilamadi - URL yanlis olabilir" };
  }
}

export default async function Home() {
  const result = await checkSupabase();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold">Para Takip</h1>
      <p className="text-sm text-gray-500">Aşama 0 — kurulum</p>
      <div
        className={`rounded-md px-4 py-2 text-sm ${
          result.ok
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {result.ok ? "✓" : "✗"} {result.msg}
      </div>
    </main>
  );
}
