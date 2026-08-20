"use client";

import { useState } from "react";

export type LinePoint = {
  period: string;
  label: string;
  net: number;
  formattedNet: string;
};

export function NetLine({ points }: { points: LinePoint[] }) {
  const [active, setActive] = useState<number | null>(null);

  const w = 560;
  const h = 190;
  const padT = 12;
  const padB = 26;
  const plot = h - padT - padB;

  const values = points.map((p) => p.net);
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;

  const x = (i: number) =>
    points.length === 1 ? w / 2 : (i / (points.length - 1)) * (w - 24) + 12;
  const y = (v: number) => padT + plot - ((v - min) / span) * plot;

  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.net)}`).join(" ");
  const area =
    `${path} L${x(points.length - 1)},${y(min)} L${x(0)},${y(min)} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        role="img"
        aria-label="Net balance by period"
        onMouseLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id="netfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1={0}
          x2={w}
          y1={y(0)}
          y2={y(0)}
          stroke="var(--rule)"
          strokeWidth={1}
        />

        <path d={area} fill="url(#netfill)" />
        <path
          d={path}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <g key={p.period} onMouseEnter={() => setActive(i)}>
            <rect
              x={x(i) - 20}
              y={0}
              width={40}
              height={h}
              fill="transparent"
            />
            {active === i && (
              <line
                x1={x(i)}
                x2={x(i)}
                y1={padT}
                y2={padT + plot}
                stroke="var(--rule)"
                strokeWidth={1}
              />
            )}
            <circle
              cx={x(i)}
              cy={y(p.net)}
              r={active === i ? 6 : 4}
              fill="var(--card)"
              stroke={p.net < 0 ? "var(--neg)" : "var(--primary)"}
              strokeWidth={2.5}
              style={{ transition: "r 120ms" }}
            >
              <title>{`${p.label}: ${p.formattedNet}`}</title>
            </circle>
            <text
              x={x(i)}
              y={h - 8}
              textAnchor="middle"
              style={{
                fontSize: 11,
                fontWeight: 600,
                fill: active === i ? "var(--ink)" : "var(--ink-3)",
              }}
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      <p className="note mt-2" style={{ minHeight: "1.25rem" }}>
        {active !== null
          ? `${points[active].label} — net ${points[active].formattedNet}`
          : "Hover a period for the exact figure."}
      </p>
    </div>
  );
}
