"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { ExportProjectData } from "@/lib/actions/export";
import type { Chapter } from "@/lib/actions/chapters";
import {
  useReaderStore,
  PRESET_COLORS,
  READER_FONTS,
  DEFAULT_READER_STATE,
  type ReaderScope,
} from "@/store/useReaderStore";
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

// Store eksternal dummy untuk useSyncExternalStore — nilainya tidak pernah
// berubah setelah mount, jadi tidak perlu subscribe apa pun.
const emptySubscribe = () => () => {};

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
  // Guard hydration: persist rehydrate sinkron dari localStorage sebelum React
  // hydrate — server & first client render pakai default, baru swap ke store.
  // useSyncExternalStore: server snapshot false, client snapshot true — pola
  // resmi React untuk nilai yang beda antara SSR dan client, tanpa setState di effect.
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const store = useReaderStore();
  const { preset, customColors, font, setLastScope } = hydrated
    ? store
    : { ...DEFAULT_READER_STATE, setLastScope: store.setLastScope };

  useEffect(() => {
    setLastScope(scope);
  }, [scope, setLastScope]);

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
        } as React.CSSProperties
      }
    >
      <ReaderProgressBar />
      <ReaderToolbar
        projectId={projectId}
        scope={scope}
        chapters={chapters}
        currentChapterId={currentChapterId}
        onOpenThemePanel={() => setThemePanelOpen(true)}
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
            {chapter.scenes.map((scene) => (
              <div
                key={scene.id}
                className="prose-inkpad"
                // Konten = HTML hasil TipTap milik user sendiri (trust boundary
                // sama dengan editor), aman dirender langsung.
                dangerouslySetInnerHTML={{ __html: scene.content }}
              />
            ))}
          </section>
        ))}
        {data.chapters.length === 0 && (
          <p className="text-center italic opacity-60">
            Belum ada chapter untuk dibaca.
          </p>
        )}
      </article>
    </div>
  );
}
