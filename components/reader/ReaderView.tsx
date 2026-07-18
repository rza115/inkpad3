"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ExportProjectData } from "@/lib/actions/export";
import type { Chapter } from "@/lib/actions/chapters";
import {
  useReaderStore,
  PRESET_COLORS,
  READER_FONTS,
  READER_FONT_SIZES,
  READER_LINE_HEIGHTS,
  DEFAULT_READER_STATE,
  type ReaderScope,
} from "@/store/useReaderStore";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { ReaderToolbar } from "@/components/reader/ReaderToolbar";
import { ReaderProgressBar } from "@/components/reader/ReaderProgressBar";
import { ReaderThemePanel } from "@/components/reader/ReaderThemePanel";

type ReaderViewProps = {
  projectId: string;
  data: ExportProjectData;
  scope: ReaderScope;
  // Hanya untuk scope chapter: daftar chapter urut buat nav prev/next
  chapters?: Chapter[];
  currentChapterId?: string;
};

// Composition root reader mode: apply tema via CSS custom properties dari
// useReaderStore (inline style di root), render konten read-only tanpa TipTap.
export function ReaderView({
  projectId,
  data,
  scope,
  chapters,
  currentChapterId,
}: ReaderViewProps) {
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const router = useRouter();
  // Guard hydration: persist rehydrate sinkron dari localStorage sebelum React
  // hydrate — server & first client render pakai default, baru swap ke store.
  const hydrated = useHydrated();

  const store = useReaderStore();
  const { preset, customColors, font, fontSize, lineHeight } = hydrated
    ? store
    : DEFAULT_READER_STATE;
  const setLastRead = store.setLastRead;

  useEffect(() => {
    // Kunjungan scope project me-null-kan chapter → jalur self-heal untuk
    // link resume yang basi.
    setLastRead(
      scope,
      projectId,
      scope === "chapter" ? (currentChapterId ?? null) : null
    );
  }, [scope, projectId, currentChapterId, setLastRead]);

  // Nav prev/next dihoist ke sini — dipakai toolbar, keyboard nav, dan footer.
  const index =
    scope === "chapter" && chapters
      ? chapters.findIndex((c) => c.id === currentChapterId)
      : -1;
  const prev = index > 0 && chapters ? chapters[index - 1] : null;
  const next =
    index >= 0 && chapters && index < chapters.length - 1
      ? chapters[index + 1]
      : null;
  const current = index >= 0 && chapters ? chapters[index] : null;
  const prevId = prev?.id;
  const nextId = next?.id;

  // Keyboard ←/→ pindah bab. Mati saat panel tema terbuka (panah dipakai
  // interaksi panel) atau fokus lagi di kontrol input.
  useEffect(() => {
    if (scope !== "chapter" || themePanelOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)
        return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true]"))
        return;
      if (e.key === "ArrowLeft" && prevId)
        router.push(`/${projectId}/read/${prevId}`);
      if (e.key === "ArrowRight" && nextId)
        router.push(`/${projectId}/read/${nextId}`);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [scope, themePanelOpen, prevId, nextId, projectId, router]);

  const colors = preset === "custom" ? customColors : PRESET_COLORS[preset];

  return (
    <div
      className="reader-theme min-h-dvh bg-[var(--reader-bg)] text-[var(--reader-text)]"
      style={
        {
          "--reader-bg": colors.bg,
          "--reader-text": colors.text,
          "--reader-accent": colors.accent,
          "--reader-font": READER_FONTS[font].family,
          "--reader-size": READER_FONT_SIZES[fontSize].value,
          "--reader-leading": READER_LINE_HEIGHTS[lineHeight].value,
        } as React.CSSProperties
      }
    >
      <ReaderProgressBar />
      <ReaderToolbar
        projectId={projectId}
        scope={scope}
        prev={prev}
        next={next}
        current={current}
        chapterIndex={index}
        chapterCount={chapters?.length ?? 0}
        onOpenThemePanel={() => setThemePanelOpen((open) => !open)}
      />
      {themePanelOpen && (
        <ReaderThemePanel onClose={() => setThemePanelOpen(false)} />
      )}

      <article className="mx-auto max-w-2xl px-4 py-12 [font-family:var(--reader-font)]">
        {scope === "project" && (
          <h1 className="mb-10 text-center text-3xl font-semibold [font-family:var(--reader-font)]">
            {data.title}
          </h1>
        )}
        {data.chapters.map((chapter) => (
          <section key={chapter.id} className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold [font-family:var(--reader-font)]">
              {chapter.title}
            </h2>
            {chapter.scenes.length === 0 && (
              <p className="italic opacity-60">Belum ada scene di chapter ini.</p>
            )}
            {chapter.scenes.map((scene, i) => (
              <Fragment key={scene.id}>
                {i > 0 && (
                  <div
                    aria-hidden
                    className="my-10 text-center text-lg tracking-[0.5em] opacity-40 select-none"
                  >
                    ⁂
                  </div>
                )}
                <div
                  className="prose-inkpad"
                  // Konten = HTML hasil TipTap milik user sendiri (trust boundary
                  // sama dengan editor), aman dirender langsung.
                  dangerouslySetInnerHTML={{ __html: scene.content }}
                />
              </Fragment>
            ))}
          </section>
        ))}
        {data.chapters.length === 0 && (
          <p className="text-center italic opacity-60">
            Belum ada chapter untuk dibaca.
          </p>
        )}

        {scope === "chapter" && data.chapters.length > 0 && (
          <footer
            className="mt-16 border-t pt-8 text-center [border-color:color-mix(in_srgb,var(--reader-text)_15%,transparent)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {next ? (
              <Link
                href={`/${projectId}/read/${next.id}`}
                className="rounded px-3 py-2 text-sm text-[var(--reader-accent)] hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--reader-accent)]"
              >
                Bab berikutnya: {next.title} →
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm opacity-60">— Tamat bab terakhir —</p>
                <Link
                  href={`/${projectId}/read`}
                  className="rounded px-3 py-2 text-sm text-[var(--reader-accent)] hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--reader-accent)]"
                >
                  Baca seluruh project
                </Link>
              </div>
            )}
          </footer>
        )}
      </article>
    </div>
  );
}
