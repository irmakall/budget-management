import { AppShell } from "@/components/nav";
import {
  PanelSkeleton,
  RowsSkeleton,
  StatsSkeleton,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <AppShell current="/transactions" title="Transactions" meta="Loading…">
      <div className="space-y-4">
        <StatsSkeleton />
        <PanelSkeleton lines={2} />
        <RowsSkeleton rows={6} />
      </div>
    </AppShell>
  );
}
