function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function getPeriod(date: string, startDay: number): string {
  const [year, month, day] = date.split("-").map(Number);

  if (day >= startDay) {
    return `${year}-${pad(month)}`;
  }

  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${pad(month - 1)}`;
}

export function getPeriodRange(
  period: string,
  startDay: number,
): { start: string; end: string } {
  const [year, month] = period.split("-").map(Number);

  const start = `${year}-${pad(month)}-${pad(startDay)}`;

  const endDate = new Date(year, month, startDay - 1);
  const end = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(
    endDate.getDate(),
  )}`;

  return { start, end };
}

export function shiftPeriod(period: string, delta: number): string {
  const [year, month] = period.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function getPeriodLabel(period: string, startDay: number): string {
  const [year, month] = period.split("-").map(Number);
  const { start, end } = getPeriodRange(period, startDay);

  const long = new Intl.DateTimeFormat("tr-TR", { month: "long" });
  const short = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  });

  const monthName = long.format(new Date(year, month - 1, 1));

  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);

  return `${monthName} dönemi (${short.format(new Date(sy, sm - 1, sd))} – ${short.format(
    new Date(ey, em - 1, ed),
  )})`;
}

export function monthsUntil(target: string, today: string): number | null {
  const [ty, tm, td] = target.split("-").map(Number);
  const [ny, nm, nd] = today.split("-").map(Number);

  let months = (ty - ny) * 12 + (tm - nm);
  if (td < nd) months -= 1;

  if (months < 0) return null;
  return months === 0 ? 1 : months;
}

export function today(): string {
  return new Date().toLocaleDateString("en-CA");
}
