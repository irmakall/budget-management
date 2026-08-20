import { AppShell } from "@/components/nav";
import { HeroSkeleton, PanelSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <AppShell current="/dashboard" title="Overview" meta="Loading…">
      <div className="grid">
        <div className="span-12">
          <HeroSkeleton />
        </div>
        <div className="span-7 stack">
          <PanelSkeleton lines={5} />
          <PanelSkeleton lines={5} />
        </div>
        <div className="span-5 stack">
          <PanelSkeleton lines={4} />
          <PanelSkeleton lines={4} />
        </div>
      </div>
    </AppShell>
  );
}
