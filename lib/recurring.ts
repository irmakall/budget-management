function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const MAX_MONTHS = 600;

export function occurrencesUpTo(
  startDate: string,
  endDate: string | null,
  dayOfMonth: number,
  until: string,
): string[] {
  const [sy, sm] = startDate.split("-").map(Number);

  const dates: string[] = [];
  let year = sy;
  let month = sm;

  for (let i = 0; i < MAX_MONTHS; i++) {
    const date = `${year}-${pad(month)}-${pad(dayOfMonth)}`;

    if (date > until) break;
    if (date >= startDate && (endDate === null || date <= endDate)) {
      dates.push(date);
    }

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return dates;
}

export function nextOccurrence(
  startDate: string,
  endDate: string | null,
  dayOfMonth: number,
  after: string,
): string | null {
  const [sy, sm] = startDate.split("-").map(Number);
  const [ay, am] = after.split("-").map(Number);

  let year = Math.max(sy, ay);
  let month = year === ay ? (year === sy ? Math.max(sm, am) : am) : sm;

  for (let i = 0; i < MAX_MONTHS; i++) {
    const date = `${year}-${pad(month)}-${pad(dayOfMonth)}`;

    if (date > after && date >= startDate) {
      if (endDate !== null && date > endDate) return null;
      return date;
    }

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return null;
}
