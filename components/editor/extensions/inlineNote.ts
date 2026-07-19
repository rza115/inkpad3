import { Mark, mergeAttributes } from "@tiptap/core";

// Fase 11: mark inline note. Beda dari entityReference (Fase 9) yang pakai
// Decoration (computed, non-persisten): note isinya manual jadi HARUS
// persisten di HTML → pakai Mark yang beneran ke-serialize ke scene.content.
//
// ATURAN EKSPOR (lihat patch/fase11-inline-notes.md Section 2): renderHTML
// hanya boleh hasilkan <span data-note-id="..."> membungkus teks asli, TANPA
// child/teks tambahan. Export strip tag via /<[^>]*>/g — kalau ada karakter
// visual (ikon/emoji) sebagai text content, dia nyempil di hasil export.
// Semua indikator visual (tint, marker) di-render lewat CSS/React terpisah,
// bukan di sini.

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inlineNote: {
      /** Pasang mark inlineNote dengan noteId ke rentang selection aktif. */
      setInlineNote: (noteId: string) => ReturnType;
      /** Buang mark inlineNote dengan noteId tertentu (dipakai saat Hapus). */
      unsetInlineNoteById: (noteId: string) => ReturnType;
    };
  }
}

export const InlineNote = Mark.create({
  name: "inlineNote",

  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-note-id"),
        renderHTML: (attributes) => {
          if (!attributes.noteId) return {};
          return { "data-note-id": attributes.noteId };
        },
      },
    };
  },

  parseHTML() {
    // Baca balik saat load existing content. Hanya span yang punya
    // data-note-id (bukan sembarang span) supaya tidak nyangkut ke markup lain.
    return [{ tag: "span[data-note-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    // 0 = content hole: teks asli user masuk di sini, tanpa tambahan apa pun.
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setInlineNote:
        (noteId) =>
        ({ commands }) =>
          commands.setMark(this.name, { noteId }),

      // Cari rentang mark yang noteId-nya cocok lalu buang mark-nya (teksnya
      // tetap, cuma highlight/tint hilang). Dipakai tombol Hapus di popover/
      // bottom sheet — teks tetap utuh, cuma catatannya yang dilepas.
      unsetInlineNoteById:
        (noteId) =>
        ({ tr, state, dispatch }) => {
          const markType = state.schema.marks[this.name];
          if (!markType) return false;

          let found = false;
          state.doc.descendants((node, pos) => {
            if (!node.isText) return;
            const mark = node.marks.find(
              (m) => m.type === markType && m.attrs.noteId === noteId
            );
            if (mark) {
              tr.removeMark(pos, pos + node.nodeSize, markType);
              found = true;
            }
          });

          if (found && dispatch) dispatch(tr);
          return found;
        },
    };
  },
});
