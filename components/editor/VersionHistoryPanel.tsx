"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ChapterVersion, VersionSnapshot } from "@/lib/actions/versions";
import { rollbackToVersion } from "@/lib/actions/versions";

function versionLabel(v: ChapterVersion): string {
  return new Date(v.created_at).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sceneCount(v: ChapterVersion): number | null {
  try {
    const snapshot = JSON.parse(v.content_snapshot) as VersionSnapshot;
    return snapshot.scenes.length;
  } catch {
    return null;
  }
}

type VersionHistoryPanelProps = {
  chapterId: string;
  projectId: string;
  versions: ChapterVersion[];
  onClose: () => void;
};

// Daftar snapshot manual (tombol "Simpan Versi") + rollback per chapter.
export function VersionHistoryPanel({
  chapterId,
  projectId,
  versions,
  onClose,
}: VersionHistoryPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRollback(versionId: string, label: string) {
    if (
      !confirm(
        `Kembalikan chapter ke versi ${label}? Konten scene saat ini akan ditimpa.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await rollbackToVersion(versionId, chapterId, projectId);
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        // Konten scene berubah di DB — reload halaman editor biar TipTap
        // re-init dari data Supabase terbaru (no local cache yang nyangkut).
        router.refresh();
        onClose();
      }
    });
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-ink/10 bg-parchment">
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
        <h3 className="font-display text-base font-semibold text-ink">
          Riwayat Versi
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup riwayat versi"
          className="rounded px-1.5 py-0.5 text-slate hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {error && (
          <p role="alert" className="mb-2 rounded border border-wine/40 bg-wine/10 px-2 py-1.5 text-xs text-wine">
            {error}
          </p>
        )}

        {versions.length === 0 ? (
          <p className="px-1 py-4 text-center text-sm text-slate">
            Belum ada versi tersimpan. Klik &ldquo;Simpan Versi&rdquo; di
            toolbar untuk membuat snapshot.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {versions.map((v) => {
              const label = versionLabel(v);
              const count = sceneCount(v);
              return (
                <li
                  key={v.id}
                  className="flex flex-col gap-1.5 rounded border border-ink/10 bg-parchment p-2.5 shadow-sm"
                >
                  <span className="font-mono text-xs text-ink">{label}</span>
                  {count !== null && (
                    <span className="font-mono text-xs text-slate/70">
                      {count} scene
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRollback(v.id, label)}
                    disabled={isPending}
                    className="self-start rounded border border-wine/50 px-2 py-0.5 font-mono text-xs text-wine transition-colors hover:bg-wine/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine disabled:opacity-50"
                  >
                    Kembalikan
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
