export const ICONS = [
  "🛒", "🏠", "🚌", "🍽️", "☕", "📺", "💊", "🎁", "✈️",
  "📚", "👕", "🔧", "🐾", "💰", "💼", "📈", "✨",
] as const;

export const COLORS = [
  "#d07803",
  "#e05574",
  "#865ddc",
  "#0092d0",
  "#009c86",
  "#729f3a",
  "#3841d0",
  "#6b6f82",
] as const;

export const COLOR_TINTS: Record<string, string> = {
  "#d07803": "var(--t-peach)",
  "#e05574": "var(--t-blush)",
  "#865ddc": "var(--t-lav)",
  "#0092d0": "var(--t-sky)",
  "#009c86": "var(--t-mint)",
  "#729f3a": "var(--t-lime)",
  "#3841d0": "var(--primary-soft)",
  "#6b6f82": "var(--card-2)",
};

export const DEFAULT_TINT = "var(--card-2)";

export const TYPES = ["income", "expense"] as const;
