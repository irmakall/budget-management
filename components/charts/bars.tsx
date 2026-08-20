"use client";

import { useState } from "react";

export type BarPoint = {
  period: string;
  label: string;
  income: number;
  expense: number;
  formattedIncome: string;
  formattedExpense: string;
};

export function Bars({ points }: { points: BarPoint[] }) {
  const [active, setActive] = useState<string | null>(null);

  const w = 560;
  const h = 200;
  const padB = 26;
  const padT = 8;
  const plot = h - padB - padT;

  const max = Math.max(1, ...points.flatMap((p) => [p.income, p.expense]));
  const slot = w / Math.max(1, points.length);
  const barW = Math.min(20, (slot - 12) / 2);

  return (
    <div>
      <div className="mb-3 flex gap-4">
        <span className="flex items-center gap-1.5 text-sm">
          <span className="dot" style={{ background: "var(--pos)" }} />
          <span style={{ color: "var(--ink-2)" }}>Income</span>
        </span>
        <span className="flex items-center gap-1.5 text-sm">
          <span className="dot" style={{ background: "var(--neg)" }} />
          <span style={{ color: "var(--ink-2)" }}>Expense</span>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        role="img"
        aria-label="Income and expense by period"
      >
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={0}
            x2={w}
            y1={padT + plot * t}
            y2={padT + plot * t}
            stroke="var(--rule)"
            strokeWidth={1}
          />
        ))}

        {points.map((p, i) => {
          const cx = slot * i + slot / 2;
          const hi = (p.income / max) * plot;
          const he = (p.expense / max) * plot;
          const dim = active && active !== p.period;

          return (
            <g
              key={p.period}
              opacity={dim ? 0.4 : 1}
              onMouseEnter={() => setActive(p.period)}
              onMouseLeave={() => setActive(null)}
              style={{ transition: "opacity 120ms" }}
            >
              <rect
                x={slot * i}
                y={0}
                width={slot}
                height={h}
                fill="transparent"
              />
              <rect
                x={cx - barW - 2}
                y={padT + plot - hi}
                width={barW}
                height={hi}
                rx={4}
                fill="var(--pos)"
              >
                <title>{`${p.label} income: ${p.formattedIncome}`}</title>
              </rect>
              <rect
                x={cx + 2}
                y={padT + plot - he}
                width={barW}
                height={he}
                rx={4}
                fill="var(--neg)"
              >
                <title>{`${p.label} expense: ${p.formattedExpense}`}</title>
              </rect>

              <text
                x={cx}
                y={h - 8}
                textAnchor="middle"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fill: active === p.period ? "var(--ink)" : "var(--ink-3)",
                }}
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="note mt-2" style={{ minHeight: "1.25rem" }}>
        {active
          ? (() => {
              const p = points.find((x) => x.period === active)!;
              return `${p.label} — income ${p.formattedIncome}, expense ${p.formattedExpense}`;
            })()
          : "Hover a period for exact figures."}
      </p>
    </div>
  );
}
