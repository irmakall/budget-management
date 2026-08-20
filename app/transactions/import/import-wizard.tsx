"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  commitImport,
  parseUpload,
  type ImportState,
  type Mapping,
  type ParseState,
} from "./actions";

const parseInitial: ParseState = {
  error: null,
  headers: null,
  rows: null,
  guess: null,
};

const importInitial: ImportState = { error: null, inserted: 0, skipped: [] };

const FIELDS: { key: keyof Mapping; label: string; hint: string }[] = [
  { key: "date", label: "Date", hint: "Required. 2026-08-20 or 20.08.2026." },
  {
    key: "amount",
    label: "Amount",
    hint: "Required. A minus sign means expense.",
  },
  {
    key: "type",
    label: "Type",
    hint: "Income or expense. Falls back to the sign.",
  },
  {
    key: "category",
    label: "Category",
    hint: "Matched to your categories by name.",
  },
  {
    key: "currency",
    label: "Currency",
    hint: "TRY, USD or EUR. Defaults to your base.",
  },
  {
    key: "rate",
    label: "Rate to base",
    hint: "Used as-is when present; skips the lookup.",
  },
  { key: "note", label: "Note", hint: "Free text." },
];

export function ImportWizard() {
  const [parsed, parseAction, isParsing] = useActionState(
    parseUpload,
    parseInitial,
  );
  const [result, importAction, isImporting] = useActionState(
    commitImport,
    importInitial,
  );

  if (result.inserted > 0) {
    return (
      <section className="card card-pad space-y-3">
        <p className="msg msg-ok" role="status">
          Imported {result.inserted} transaction
          {result.inserted === 1 ? "" : "s"}.
        </p>
        {result.skipped.length > 0 && (
          <details>
            <summary className="details-summary">
              {result.skipped.length} row
              {result.skipped.length === 1 ? "" : "s"} skipped
            </summary>
            <ul className="note space-y-1 pt-2">
              {result.skipped.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </details>
        )}
        <Link href="/transactions" className="btn btn-primary btn-sm">
          Back to transactions
        </Link>
      </section>
    );
  }

  const preview = parsed.rows?.slice(0, 5) ?? [];

  return (
    <div className="space-y-4">
      <form action={parseAction} className="card card-pad space-y-3">
        <div className="toolbar">
          <div className="field toolbar-grow">
            <label htmlFor="file" className="label">
              CSV file
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              className="input"
            />
          </div>
          <button
            type="submit"
            disabled={isParsing}
            className="btn btn-secondary"
          >
            {isParsing ? "Reading…" : "Read file"}
          </button>
        </div>

        <p className="note">
          Up to 1 MB and 2000 rows. Comma or semicolon separated. Nothing is
          saved until you confirm on the next step.
        </p>

        {parsed.error && (
          <p className="msg msg-error" role="status">
            {parsed.error}
          </p>
        )}
      </form>

      {parsed.headers && parsed.rows && parsed.guess && (
        <form action={importAction} className="card card-pad space-y-4">
          <input
            type="hidden"
            name="rows"
            value={JSON.stringify(parsed.rows)}
          />

          <div>
            <h2 className="row-title">Match the columns</h2>
            <p className="note">
              {parsed.rows.length} data row
              {parsed.rows.length === 1 ? "" : "s"} found.
            </p>
          </div>

          <div className="form-grid">
            {FIELDS.map((field) => (
              <div
                key={field.key}
                className="field"
                style={{ flex: "1 1 11rem" }}
              >
                <label htmlFor={`map-${field.key}`} className="label">
                  {field.label}
                </label>
                <select
                  id={`map-${field.key}`}
                  name={`map_${field.key}`}
                  defaultValue={String(parsed.guess![field.key])}
                  className="select"
                >
                  <option value="-1">— not in file —</option>
                  {parsed.headers!.map((header, index) => (
                    <option key={index} value={index}>
                      {header === "" ? `Column ${index + 1}` : header}
                    </option>
                  ))}
                </select>
                <span className="note">{field.hint}</span>
              </div>
            ))}
          </div>

          <div className="table-scroll">
            <table className="table">
              <caption className="sr-only">
                First rows of the uploaded file
              </caption>
              <thead>
                <tr>
                  {parsed.headers.map((header, index) => (
                    <th key={index} scope="col">
                      {header === "" ? `Column ${index + 1}` : header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {parsed.headers!.map((_, index) => (
                      <td key={index}>{row[index] ?? ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="note flex items-center gap-2">
            <input type="checkbox" name="create_missing" defaultChecked />
            Create categories that do not exist yet
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isImporting}
              className="btn btn-primary"
            >
              {isImporting ? "Importing…" : "Import"}
            </button>
            <Link href="/transactions" className="btn btn-ghost">
              Cancel
            </Link>
          </div>

          {result.error && (
            <p className="msg msg-error" role="status">
              {result.error}
            </p>
          )}

          {result.skipped.length > 0 && (
            <details>
              <summary className="details-summary">
                {result.skipped.length} row
                {result.skipped.length === 1 ? "" : "s"} could not be read
              </summary>
              <ul className="note space-y-1 pt-2">
                {result.skipped.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </details>
          )}
        </form>
      )}
    </div>
  );
}
