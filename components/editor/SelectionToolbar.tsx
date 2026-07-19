"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

// Floating toolbar di atas text selection (elemen UI baru — belum ada di
// codebase). Muncul saat ada selection non-empty di editor aktif, hilang saat
// selection kosong/blur. Posisi dihitung dari coordsAtPos() ujung selection.
//
// onCreate(content) dipanggil saat submit — parent (EditorCanvas) yang urus
// createInlineNote + apply mark, komponen ini murni presentasi + input.
type SelectionToolbarProps = {
  editor: Editor | null;
  onCreate: (content: string) => Promise<void>;
};

type Box = { top: number; left: number };

export function SelectionToolbar({ editor, onCreate }: SelectionToolbarProps) {
  const [box, setBox] = useState<Box | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ref mirror biar handler di effect posisi baca nilai expanded terbaru tanpa
  // re-subscribe tiap toggle (begitu expanded, selection editor blur — jangan
  // langsung tutup toolbar-nya).
  const expandedRef = useRef(expanded);
  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  // Recompute posisi tiap selection/transaction editor aktif berubah.
  useEffect(() => {
    if (!editor) {
      setBox(null);
      return;
    }

    function update() {
      // Non-null: guard di atas sudah return kalau editor null, tapi handler
      // ini bisa ke-fire async — cek ulang biar TS & runtime aman.
      if (!editor) return;
      const { state, view } = editor;
      const { from, to, empty } = state.selection;

      // Selection kosong → tutup toolbar & reset input (kecuali lagi ngetik
      // catatan: begitu expanded, selection editor blur, jangan langsung tutup).
      if (empty || !view.hasFocus()) {
        if (!expandedRef.current) {
          setBox(null);
          setExpanded(false);
          setValue("");
        }
        return;
      }

      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      const top = Math.min(start.top, end.top);
      const left = (start.left + end.left) / 2;
      setBox({ top, left });
    }

    update();
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  if (!box) return null;

  async function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onCreate(trimmed);
      setExpanded(false);
      setValue("");
      setBox(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      // Fixed dari coords viewport (coordsAtPos = koordinat viewport).
      // -translate biar toolbar duduk di atas-tengah selection.
      style={{ position: "fixed", top: box.top, left: box.left }}
      className="z-50 -translate-x-1/2 -translate-y-[calc(100%+8px)]"
      // Jangan biar mousedown di toolbar nge-blur/collapse selection editor —
      // KECUALI di input: default mousedown pada input = fokus + taruh caret.
      // Handler ini di container dan event bubble dari child, jadi tanpa
      // pengecualian ini klik ke input ikut ke-preventDefault → fokus tak
      // pernah masuk ke input → ketikan tidak masuk (bug fix, lihat
      // patch/prompt-fix-selection-toolbar-focus.md).
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest("input")) e.preventDefault();
      }}
    >
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-sm text-parchment shadow-lg transition-colors hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 text-brass"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Tambah catatan
        </button>
      ) : (
        <div className="flex items-center gap-1.5 rounded-lg bg-ink px-2 py-1.5 shadow-lg">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSubmit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setExpanded(false);
                setValue("");
              }
            }}
            placeholder="Isi catatan…"
            aria-label="Isi catatan"
            className="w-48 rounded border border-parchment/20 bg-parchment/5 px-2 py-1 text-sm text-parchment placeholder:text-parchment/40 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brass"
          />
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || !value.trim()}
            className="rounded bg-brass px-2.5 py-1 text-sm font-medium text-ink transition-colors hover:bg-brass/90 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brass disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "…" : "Simpan"}
          </button>
        </div>
      )}
    </div>
  );
}
