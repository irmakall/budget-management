export const SERIES = [
  "#008762",
  "#397be9",
  "#976500",
  "#9a4c95",
  "#f1498d",
] as const;

export const OTHER = "#8b8fa3";

export function colorFor(id: string, own: string | null): string {
  if (own) return own;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return SERIES[h % SERIES.length];
}
