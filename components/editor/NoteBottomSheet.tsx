"use client";

import { useEditorStore } from "@/store/useEditorStore";

// Mobile (< md) bottom sheet isi inline note. Slide dari bawah (bukan popover
// mengambang — tidak ada ruang kolom margin di mobile). Isi: kutipan teks
// asli + isi catatan + tombol Hapus/Tutup. Backdrop tap = tutup.
type NoteBottomSheetProps = {
  onDelete: () => void;
  onClose: () => void;
  deleting: boolean;
};

export function NoteBottomSheet({
  onDelete,
  onClose,
  deleting,
}: NoteBottomSheetProps) {
  const activeNoteRef = useEditorStore((s) => s.activeNoteRef);

  if (!activeNoteRef) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Tutup catatan"
        onClick={onClose}
        className="absolute inset-0 bg-ink/50"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-label="Catatan"
        className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-parchment px-5 pb-6 pt-3 shadow-lg"
      >
        <div
          aria-hidden
          className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate/30"
        />
        <p className="border-l-2 border-brass pl-3 font-display text-sm italic text-slate">
          “{activeNoteRef.quotedText}”
        </p>
        <p className="mt-3 text-base leading-relaxed text-ink">
          {activeNoteRef.content}
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-sm font-medium text-slate transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded border border-wine/40 px-4 py-2 text-sm font-medium text-wine transition-colors hover:bg-wine/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Menghapus…" : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
