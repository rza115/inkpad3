"use client";

import { useUIStore } from "@/store/useUIStore";
import { useReadHref } from "@/lib/hooks/useReadHref";
import { SidebarNavItem } from "./SidebarNavItem";

// Daftar section per project — dipakai Sidebar (desktop) & MobileNav (drawer).
// Editor sengaja tidak ada di sini: diakses lewat klik chapter di Outline (Fase 3).
export const PROJECT_NAV_ITEMS = [
  {
    segment: "outline",
    label: "Outline",
    iconD: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  },
  {
    segment: "notes",
    label: "Notes",
    iconD: "M9 12h6m-6 4h4m4 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.6a1 1 0 0 1 .7.3l5.4 5.4a1 1 0 0 1 .3.7V19a2 2 0 0 1-2 2z",
  },
  {
    segment: "characters",
    label: "Characters",
    iconD: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM5 21a7 7 0 0 1 14 0",
  },
  {
    segment: "plot",
    label: "Plot",
    iconD: "M5 21V5a2 2 0 0 1 2-2h11l-2.5 4.5L18 12H7",
  },
  {
    segment: "worldbuilding",
    label: "Worldbuilding",
    iconD: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18",
  },
  {
    segment: "illustration",
    label: "Illustration",
    iconD: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm4.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
  },
  {
    segment: "read",
    label: "Baca",
    iconD: "M12 6.25C10 4.75 7.5 4 4 4v15c3.5 0 6 .75 8 2.25 2-1.5 4.5-2.25 8-2.25V4c-3.5 0-6 .75-8 2.25zm0 0v15",
  },
  {
    segment: "export",
    label: "Export",
    iconD: "M12 15V3m0 0L8 7m4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  },
  {
    segment: "trash",
    label: "Trash",
    iconD: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14",
  },
] as const;

export function Sidebar({ projectId }: { projectId: string }) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  // Link "Baca" resume ke chapter terakhir dibaca (lastScope di reader store).
  const readHref = useReadHref(projectId);

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-parchment/10 bg-ink transition-[width] md:flex ${
        sidebarCollapsed ? "w-14" : "w-56"
      }`}
    >
      <nav
        aria-label="Navigasi project"
        className="flex flex-1 flex-col gap-1 overflow-y-auto p-2"
      >
        {PROJECT_NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.segment}
            href={
              item.segment === "read" ? readHref : `/${projectId}/${item.segment}`
            }
            label={item.label}
            iconD={item.iconD}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        aria-label={sidebarCollapsed ? "Perlebar sidebar" : "Ciutkan sidebar"}
        className="m-2 flex items-center justify-center rounded p-2 text-parchment/60 transition-colors hover:bg-parchment/10 hover:text-parchment focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`size-4 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`}
        >
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
    </aside>
  );
}
