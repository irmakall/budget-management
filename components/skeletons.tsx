export function Line({
  width = "100%",
  height = "0.875rem",
}: {
  width?: string;
  height?: string;
}) {
  return <span className="skeleton block" style={{ width, height }} />;
}

export function PanelSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <section className="panel space-y-3" aria-hidden>
      <Line width="9rem" height="1rem" />
      {Array.from({ length: lines }, (_, i) => (
        <Line key={i} width={i % 2 === 0 ? "100%" : "80%"} />
      ))}
    </section>
  );
}

export function StatsSkeleton() {
  return (
    <div className="stats" aria-hidden>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="stat stat-net space-y-2">
          <Line width="4rem" height="0.75rem" />
          <Line width="7rem" height="1.25rem" />
        </div>
      ))}
    </div>
  );
}

export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="rows" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="row">
          <span className="skeleton tile" />
          <div className="row-main space-y-2">
            <Line width="40%" />
            <Line width="25%" height="0.75rem" />
          </div>
          <Line width="5rem" height="1rem" />
        </li>
      ))}
    </ul>
  );
}

export function HeroSkeleton() {
  return (
    <div
      className="skeleton"
      style={{ height: "9rem", borderRadius: "var(--r-xl)" }}
      aria-hidden
    />
  );
}
