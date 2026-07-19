"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store/useEditorStore";

// Desktop (md+) popover isi inline note. Posisi fixed dari activeNoteRef.rect
// (pola sama EntityRefPopover Fase 9), tapi INTERAKTIF (ada tombol Hapus/Tutup)
// jadi pointer-events aktif. Muncul di sebelah/atas marker yang diklik.
type NotePopoverProps = {
  onDelete: () => void;
  onClose: () => void;
  deleting: boolean;
};

export function NotePopover({ onDelete, onClose, deleting }: NotePopoverProps) {
  const activeNoteRef = useEditorStore((s) => s.activeNoteRef);
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    visibility: "hidden",
  });

  useLayoutEffect(() => {
    if (!activeNoteRef || !cardRef.current) return;

    const { rect } = activeNoteRef;
    const card = cardRef.current.getBoundingClientRect();
    const GAP = 8;

    // Default di bawah marker; flip ke atas kalau kepotong bawah viewport.
    const below = rect.bottom + GAP;
    const top =
      below + card.height > window.innerHeight
        ? Math.max(GAP, rect.top - card.height - GAP)
        : below;

    const left = Math.min(
      Math.max(GAP, rect.left + rect.width / 2 - card.width / 2),
      window.innerWidth - card.width - GAP
    );

    setStyle({ top, left, visibility: "visible" });
  }, [activeNoteRef]);

  if (!activeNoteRef) return null;

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-label="Catatan"
      style={{ position: "fixed", ...style }}
      className="z-50 hidden w-[260px] rounded-lg bg-ink px-3 py-2.5 text-parchment shadow-lg md:block"
    >
      <p className="border-l-2 border-brass/60 pl-2 font-display text-xs italic text-parchment/70">
        “{activeNoteRef.quotedText}”
      </p>
      <p className="mt-2 text-sm leading-relaxed">{activeNoteRef.content}</p>
      <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-parchment/10 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded px-2 py-1 font-mono text-xs text-parchment/70 transition-colors hover:bg-parchment/10 hover:text-parchment focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brass"
        >
          Tutup
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="rounded border border-wine/50 px-2 py-1 font-mono text-xs text-parchment transition-colors hover:bg-wine/30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brass disabled:opacity-50"
        >
          {deleting ? "Menghapus…" : "Hapus"}
        </button>
      </div>
    </div>
  );
}
