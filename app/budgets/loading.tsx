import { AppShell } from "@/components/nav";
import { RowsSkeleton, StatsSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <AppShell current="/budgets" title="Budgets" meta="Loading…">
      <div className="space-y-4">
        <StatsSkeleton />
        <RowsSkeleton rows={6} />
      </div>
    </AppShell>
  );
}
