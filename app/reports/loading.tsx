import { AppShell } from "@/components/nav";
import { PanelSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <AppShell current="/reports" title="Reports" meta="Loading…">
      <div className="space-y-4">
        <PanelSkeleton lines={6} />
        <PanelSkeleton lines={6} />
        <PanelSkeleton lines={6} />
      </div>
    </AppShell>
  );
}
