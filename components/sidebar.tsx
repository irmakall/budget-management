import Link from "next/link";
import type { ReactNode } from "react";

type Item = { href: string; label: string; short: string; icon: ReactNode };

const s = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ITEMS: Item[] = [
  {
    href: "/dashboard",
    label: "Overview",
    short: "Home",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden {...s}>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </svg>
    ),
  },
  {
    href: "/transactions",
    label: "Transactions",
    short: "Entries",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden {...s}>
        <path d="M4 8h13l-3-3" />
        <path d="M20 16H7l3 3" />
      </svg>
    ),
  },
  {
    href: "/reports",
    label: "Reports",
    short: "Reports",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden {...s}>
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-7" />
        <path d="M22 20H2" />
      </svg>
    ),
  },
  {
    href: "/budgets",
    label: "Budgets",
    short: "Budget",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden {...s}>
        <rect x="3" y="6" width="18" height="13" rx="3" />
        <path d="M16 12h2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/goals",
    label: "Goals",
    short: "Goals",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden {...s}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    href: "/recurring",
    label: "Recurring",
    short: "Repeat",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden {...s}>
        <path d="M4 11a8 8 0 0 1 13.7-5.6L20 7" />
        <path d="M20 4v3h-3" />
        <path d="M20 13a8 8 0 0 1-13.7 5.6L4 17" />
        <path d="M4 20v-3h3" />
      </svg>
    ),
  },
  {
    href: "/categories",
    label: "Categories",
    short: "Tags",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden {...s}>
        <path d="M3 7h18" />
        <path d="M3 12h18" />
        <path d="M3 17h11" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    short: "Setup",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden {...s}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
];

export function Sidebar({
  current,
  note,
}: {
  current?: string;
  note?: string;
}) {
  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="wordmark sidebar-brand">
        Para Takip
      </Link>

      <nav className="sidebar-nav" aria-label="Sections">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="navlink"
            aria-current={item.href === current ? "page" : undefined}
          >
            {item.icon}
            <span className="navlink-full">{item.label}</span>
            <span className="navlink-short">{item.short}</span>
          </Link>
        ))}
      </nav>

      {note && <p className="sidebar-foot">{note}</p>}
    </aside>
  );
}
