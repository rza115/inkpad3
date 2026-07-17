"use client";

import { useUIStore } from "@/store/useUIStore";
import { SidebarNavItem } from "./SidebarNavItem";
import { PROJECT_NAV_ITEMS } from "./Sidebar";

// Drawer navigasi versi mobile (< md). Dipisah dari Sidebar biar breakpoint
// logic gak numpuk di satu file — sesuai catatan file breakdown Fase 2.
export function MobileNav({ projectId }: { projectId: string }) {
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);

  if (!mobileNavOpen) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Tutup navigasi"
        onClick={() => setMobileNavOpen(false)}
        className="absolute inset-0 bg-ink/60"
      />

      {/* Drawer */}
      <nav
        aria-label="Navigasi project"
        className="absolute inset-y-0 left-0 flex w-64 max-w-[80vw] flex-col gap-1 overflow-y-auto bg-ink p-2 shadow-lg"
      >
        <div className="flex items-center justify-between px-3 py-2">
          <span className="font-display text-lg font-semibold text-parchment">
            InkPad
          </span>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Tutup navigasi"
            className="rounded p-1 text-parchment/60 hover:bg-parchment/10 hover:text-parchment focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {PROJECT_NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.segment}
            href={`/${projectId}/${item.segment}`}
            label={item.label}
            iconD={item.iconD}
            onNavigate={() => setMobileNavOpen(false)}
          />
        ))}
      </nav>
    </div>
  );
}
