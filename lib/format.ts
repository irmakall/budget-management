export function money(value: number, currency: string): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
  }).format(value);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
