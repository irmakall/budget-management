export async function getRate(
  from: string,
  to: string,
  date: string,
): Promise<number> {
  if (from === to) {
    return 1;
  }

  const response = await fetch(
    `https://api.frankfurter.dev/v1/${date}?base=${from}&symbols=${to}`,
    { cache: "force-cache" },
  );

  if (!response.ok) {
    throw new Error(`Exchange rate service failed: ${response.status}`);
  }

  const data = await response.json();
  const rate = data?.rates?.[to];

  if (typeof rate !== "number") {
    throw new Error(`Kur bulunamadı: ${from}→${to} (${date})`);
  }
  return rate;
}
