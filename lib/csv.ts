export function toCsvValue(value: string | number | null): string {
  if (value === null) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(
  headers: string[],
  rows: (string | number | null)[][],
): string {
  const lines = [headers.map(toCsvValue).join(",")];
  for (const row of rows) lines.push(row.map(toCsvValue).join(","));
  return lines.join("\r\n");
}

export function parseCsv(text: string, delimiter = ","): string[][] {
  const clean = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };

  while (i < clean.length) {
    const c = clean[i];

    if (quoted) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }

    if (c === '"') {
      quoted = true;
      i += 1;
      continue;
    }
    if (c === delimiter) {
      pushField();
      i += 1;
      continue;
    }
    if (c === "\r") {
      i += 1;
      continue;
    }
    if (c === "\n") {
      pushRow();
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }

  if (field !== "" || row.length > 0) pushRow();

  return rows;
}

export function detectDelimiter(text: string): "," | ";" {
  const firstLine = text.replace(/^﻿/, "").split(/\r?\n/)[0] ?? "";
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

export function parseAmount(raw: string): number | null {
  const text = raw
    .trim()
    .replace(/[\s ]/g, "")
    .replace(/[^\d.,+-]/g, "");
  if (text === "") return null;

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");

  let normalized: string;
  if (lastComma > lastDot) {
    normalized = text.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    normalized = text.replace(/,/g, "");
  } else {
    normalized = text;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function normalizeDate(raw: string): string | null {
  const text = raw.trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(text);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    if (Number(month) > 12 || Number(day) > 31) return null;
    return `${dmy[3]}-${month}-${day}`;
  }

  return null;
}
