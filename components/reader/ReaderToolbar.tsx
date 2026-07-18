"use client";

import Link from "next/link";
import type { Chapter } from "@/lib/actions/chapters";
import type { ReaderScope } from "@/store/useReaderStore";

type ReaderToolbarProps = {
  projectId: string;
  scope: ReaderScope;
  // Komputasi prev/next/current dihoist ke ReaderView (dipakai juga keyboard
  // nav & footer) — toolbar tinggal render.
  prev: Chapter | null;
  next: Chapter | null;
  current: Chapter | null;
  chapterIndex: number;
  chapterCount: number;
  onOpenThemePanel: () => void;
};

// Toolbar tipis reader: exit, nav prev/next chapter (scope chapter), tombol tema.
// Styling pakai variabel tema reader biar ikut preset/custom.
export function ReaderToolbar({
  projectId,
  scope,
  prev,
  next,
  current,
  chapterIndex,
  chapterCount,
  onOpenThemePanel,
}: ReaderToolbarProps) {
  const navLinkClass =
    "rounded px-2 py-1 text-sm hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--reader-accent)]";

  return (
    <header
      className="sticky top-0 z-40 border-b bg-[var(--reader-bg)] [border-color:color-mix(in_srgb,var(--reader-text)_15%,transparent)]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-2">
        <Link
          href={`/${projectId}/outline`}
          aria-label="Keluar dari reader"
          className={navLinkClass}
        >
          ← Keluar
        </Link>

        <div className="min-w-0 flex-1 text-center">
          {scope === "chapter" && current ? (
            <span className="block truncate text-sm">
              Bab {chapterIndex + 1} / {chapterCount} — {current.title}
            </span>
          ) : (
            <span className="block truncate text-sm opacity-70">
              Seluruh project
            </span>
          )}
        </div>

        {scope === "chapter" && (
          <>
            {prev ? (
              <Link
                href={`/${projectId}/read/${prev.id}`}
                aria-label={`Chapter sebelumnya: ${prev.title}`}
                className={navLinkClass}
              >
                ‹
              </Link>
            ) : (
              <span className={`${navLinkClass} cursor-default opacity-30`}>‹</span>
            )}
            {next ? (
              <Link
                href={`/${projectId}/read/${next.id}`}
                aria-label={`Chapter berikutnya: ${next.title}`}
                className={navLinkClass}
              >
                ›
              </Link>
            ) : (
              <span className={`${navLinkClass} cursor-default opacity-30`}>›</span>
            )}
            <Link href={`/${projectId}/read`} className={navLinkClass}>
              Baca semua
            </Link>
          </>
        )}

        <button
          type="button"
          data-theme-trigger
          onClick={onOpenThemePanel}
          className={navLinkClass}
          aria-label="Buka pengaturan tema reader"
        >
          Tema
        </button>
      </div>
    </header>
  );
}
