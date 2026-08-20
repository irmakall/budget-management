import { AppShell } from "@/components/nav";
import { PanelSkeleton, RowsSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <AppShell current="/categories" title="Categories" meta="Loading…">
      <div className="space-y-4">
        <PanelSkeleton lines={2} />
        <RowsSkeleton rows={6} />
      </div>
    </AppShell>
  );
}
