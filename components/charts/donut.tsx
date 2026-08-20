"use client";

import { useState } from "react";

export type Slice = {
  id: string;
  label: string;
  value: number;
  formatted: string;
  color: string;
};

export function Donut({
  slices,
  total,
  formattedTotal,
}: {
  slices: Slice[];
  total: number;
  formattedTotal: string;
}) {
  const [active, setActive] = useState<string | null>(null);

  const size = 168;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const gap = 3;

  const arcs: (Slice & { len: number; offset: number; frac: number })[] = [];
  for (let i = 0, run = 0; i < slices.length; i++) {
    const s = slices[i];
    const frac = total > 0 ? s.value / total : 0;
    arcs.push({
      ...s,
      frac,
      offset: run,
      len: Math.max(0, frac * circumference - gap),
    });
    run += frac * circumference;
  }

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Spending by category"
        style={{ flex: "none" }}
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {arcs.map((a) => (
            <circle
              key={a.id}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={active === a.id ? stroke + 5 : stroke}
              strokeDasharray={`${a.len} ${circumference - a.len}`}
              strokeDashoffset={-a.offset}
              strokeLinecap="butt"
              opacity={active && active !== a.id ? 0.35 : 1}
              onMouseEnter={() => setActive(a.id)}
              onMouseLeave={() => setActive(null)}
              style={{
                transition: "stroke-width 120ms, opacity 120ms",
                cursor: "default",
              }}
            >
              <title>{`${a.label}: ${a.formatted}`}</title>
            </circle>
          ))}
        </g>

        <text
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          style={{ fontSize: 11, fontWeight: 600, fill: "var(--ink-3)" }}
        >
          Total
        </text>
        <text
          x={size / 2}
          y={size / 2 + 14}
          textAnchor="middle"
          style={{
            fontSize: 15,
            fontWeight: 800,
            fill: "var(--ink)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formattedTotal}
        </text>
      </svg>

      <ul className="legend">
        {arcs.map((a) => (
          <li
            key={a.id}
            className="legend-row"
            onMouseEnter={() => setActive(a.id)}
            onMouseLeave={() => setActive(null)}
            style={{ opacity: active && active !== a.id ? 0.5 : 1 }}
          >
            <span aria-hidden className="dot" style={{ background: a.color }} />
            <span className="legend-name">{a.label}</span>
            <span className="num text-sm">{a.formatted}</span>
            <span className="num legend-pct text-sm">
              {Math.round(a.frac * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
