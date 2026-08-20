import Link from "next/link";
import { getPeriodLabel, shiftPeriod } from "@/lib/period";

export function PeriodNav({
  basePath,
  period,
  startDay,
}: {
  basePath: string;
  period: string;
  startDay: number;
}) {
  return (
    <div className="card flex items-center gap-1 px-2 py-1">
      <Link
        href={`${basePath}?period=${shiftPeriod(period, -1)}`}
        className="btn btn-ghost btn-round"
        aria-label="Previous period"
      >
        ←
      </Link>

      <span
        className="section-label px-1 text-center"
        style={{ color: "var(--ink)" }}
      >
        {getPeriodLabel(period, startDay)}
      </span>

      <Link
        href={`${basePath}?period=${shiftPeriod(period, 1)}`}
        className="btn btn-ghost btn-round"
        aria-label="Next period"
      >
        →
      </Link>
    </div>
  );
}
