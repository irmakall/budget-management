import { AppShell } from "@/components/nav";
import { PanelSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <AppShell current="/settings" title="Settings" meta="Loading…">
      <div className="grid">
        <div className="span-6">
          <PanelSkeleton lines={5} />
        </div>
      </div>
    </AppShell>
  );
}
