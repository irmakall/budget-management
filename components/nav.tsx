import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";

type Props = {
  current?: string;
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  sidebarNote?: string;
  children: ReactNode;
};

export function AppShell({
  current,
  title,
  meta,
  actions,
  sidebarNote,
  children,
}: Props) {
  return (
    <div className="layout">
      <Sidebar current={current} note={sidebarNote} />

      <div className="content">
        <header className="topbar">
          <div>
            <h1 className="page-title">{title}</h1>
            {meta && <p className="note">{meta}</p>}
          </div>
          {actions && <div className="topbar-actions">{actions}</div>}
        </header>

        {children}
      </div>
    </div>
  );
}
