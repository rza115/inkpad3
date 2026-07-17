"use client";

import { useEditorStore } from "@/store/useEditorStore";

// Badge saved/saving/failed per scene + tombol retry. Wajib jelas kelihatan:
// no local-first, user harus tahu kalau ada write yang gagal.
export function SaveStatusIndicator({ sceneId }: { sceneId: string }) {
  const status = useEditorStore((s) => s.sceneStatuses[sceneId]) ?? "saved";
  const retry = useEditorStore((s) => s.retryCallbacks[sceneId]);

  if (status === "failed") {
    return (
      <span role="alert" className="flex items-center gap-2">
        <span className="font-mono text-xs font-semibold text-wine">
          ✕ Gagal tersimpan
        </span>
        <button
          type="button"
          onClick={() => retry?.()}
          className="rounded border border-wine/60 px-1.5 py-0.5 font-mono text-xs text-wine hover:bg-wine/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
        >
          Coba lagi
        </button>
      </span>
    );
  }

  return (
    <span role="status" className="font-mono text-xs text-slate/70">
      {status === "saving" ? "Menyimpan…" : "✓ Tersimpan"}
    </span>
  );
}
