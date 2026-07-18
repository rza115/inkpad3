"use client";

import { useReaderStore } from "@/store/useReaderStore";
import { useHydrated } from "@/lib/hooks/useHydrated";

// Href tujuan link "Baca" di Sidebar/MobileNav: resume ke chapter terakhir
// dibaca kalau ada, selain itu scope project. Selector per-field supaya nav
// tidak re-render saat preferensi tema berubah. Hydration-safe: server &
// first client render sama-sama dapat href dasar, upgrade setelah hydrate.
export function useReadHref(projectId: string): string {
  const hydrated = useHydrated();
  const lastScope = useReaderStore((s) => s.lastScope);
  const lastReadProjectId = useReaderStore((s) => s.lastReadProjectId);
  const lastReadChapterId = useReaderStore((s) => s.lastReadChapterId);

  if (
    hydrated &&
    lastScope === "chapter" &&
    lastReadProjectId === projectId &&
    lastReadChapterId
  ) {
    return `/${projectId}/read/${lastReadChapterId}`;
  }
  return `/${projectId}/read`;
}
