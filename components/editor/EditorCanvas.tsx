"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Chapter } from "@/lib/actions/chapters";
import type { Scene } from "@/lib/actions/scenes";
import { updateSceneContent } from "@/lib/actions/scenes";
import type { ChapterVersion } from "@/lib/actions/versions";
import type { Character } from "@/lib/actions/characters";
import type { WorldbuildingEntry } from "@/lib/actions/worldbuilding";
import {
  createInlineNote,
  deleteInlineNote,
  deleteOrphanedInlineNotes,
  type InlineNote,
} from "@/lib/actions/inlineNotes";
import { buildEntityIndex, type EntityRef } from "@/lib/editor/entityIndex";
import { useDebouncedSave } from "@/lib/hooks/useDebouncedSave";
import { useEditorStore } from "@/store/useEditorStore";
import { EntityReference } from "./extensions/entityReference";
import { InlineNote as InlineNoteMark } from "./extensions/inlineNote";
import { EntityRefPopover } from "./EntityRefPopover";
import { SelectionToolbar } from "./SelectionToolbar";
import { NotePopover } from "./NotePopover";
import { NoteBottomSheet } from "./NoteBottomSheet";
import { EditorToolbar } from "./EditorToolbar";
import { WordCountBadge } from "./WordCountBadge";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import { VersionHistoryPanel } from "./VersionHistoryPanel";

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// Semua data-note-id yang masih ada di HTML final (buat reconciliation).
function extractNoteIds(html: string): string[] {
  const ids: string[] = [];
  const re = /data-note-id="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    ids.push(m[1]);
  }
  return ids;
}

// Posisi satu marker (per note) relatif ke kolom scroll — dihitung dari rect
// span [data-note-id]. top = tengah vertikal span.
type MarkerPos = { noteId: string; top: number };

// Satu instance TipTap per scene, semua scene ditumpuk berurutan di satu
// canvas parchment (keputusan user: continuous view). Draft hidup di TipTap
// selama halaman terbuka; autosave debounced per scene ke Supabase.
function SceneEditor({
  scene,
  entityIndex,
  notes,
  onFocus,
  onRegisterEditor,
  onCreateNote,
  onReconcile,
  onOpenNote,
}: {
  scene: Scene;
  entityIndex: EntityRef[];
  notes: InlineNote[];
  onFocus: (editor: Editor) => void;
  onRegisterEditor: (sceneId: string, editor: Editor | null) => void;
  onCreateNote: (editor: Editor, content: string) => Promise<void>;
  onReconcile: (sceneId: string, html: string) => void;
  onOpenNote: (note: InlineNote, rect: DOMRect) => void;
}) {
  // Reconciliation numpang siklus autosave (Step 6): tiap save sukses, ekstrak
  // data-note-id yang tersisa → hapus row inline_notes yang mark-nya kebuang.
  const handleSaved = useCallback(
    (html: string) => onReconcile(scene.id, html),
    [scene.id, onReconcile]
  );
  const { scheduleSave } = useDebouncedSave(
    scene.id,
    updateSceneContent,
    handleSaved
  );
  const setWordCount = useEditorStore((s) => s.setWordCount);
  const contentRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<MarkerPos[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      EntityReference.configure({ entityIndex }),
      InlineNoteMark,
    ],
    content: scene.content || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose-inkpad min-h-24 max-w-none px-1 py-2 focus:outline-none",
        "aria-label": "Area menulis scene",
      },
    },
    onUpdate: ({ editor }) => {
      scheduleSave(editor.getHTML());
      setWordCount(scene.id, countWords(editor.getText()));
    },
    onFocus: ({ editor }) => onFocus(editor),
  });

  // Word count awal
  useEffect(() => {
    if (editor) {
      setWordCount(scene.id, countWords(editor.getText()));
    }
  }, [editor, scene.id, setWordCount]);

  // Daftarkan editor ke parent (buat strip mark saat Hapus note dari popover).
  useEffect(() => {
    onRegisterEditor(scene.id, editor);
    return () => onRegisterEditor(scene.id, null);
  }, [editor, scene.id, onRegisterEditor]);

  // Refresh entity index tanpa remount (configure() cuma kebaca saat init).
  useEffect(() => {
    if (editor) {
      editor.commands.updateEntityIndex(entityIndex);
    }
  }, [editor, entityIndex]);

  // Hitung posisi marker dari rect tiap span [data-note-id]. Recompute saat
  // konten berubah + saat resize (breakpoint/reflow). Marker di-render sebagai
  // elemen React (BUKAN karakter di scene.content — lihat Section 2 dokumen).
  const recomputeMarkers = useCallback(() => {
    const root = contentRef.current;
    if (!root) return;
    const containerTop = root.getBoundingClientRect().top;
    const seen = new Set<string>();
    const next: MarkerPos[] = [];
    root.querySelectorAll<HTMLElement>("[data-note-id]").forEach((el) => {
      const noteId = el.dataset.noteId;
      if (!noteId || seen.has(noteId)) return; // 1 marker per note walau kepecah
      seen.add(noteId);
      const r = el.getBoundingClientRect();
      next.push({ noteId, top: r.top + r.height / 2 - containerTop });
    });
    setMarkers(next);
  }, []);

  useEffect(() => {
    if (!editor) return;
    // rAF: ukur setelah paint (rect valid) + hindari setState sinkron di
    // body effect (aturan lint react-hooks/set-state-in-effect).
    let raf = requestAnimationFrame(recomputeMarkers);
    const onTx = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(recomputeMarkers);
    };
    editor.on("transaction", onTx);
    window.addEventListener("resize", onTx);
    return () => {
      cancelAnimationFrame(raf);
      editor.off("transaction", onTx);
      window.removeEventListener("resize", onTx);
    };
  }, [editor, recomputeMarkers, notes]);

  // Lookup note by id (buat marker onClick).
  const notesById = useMemo(() => {
    const map: Record<string, InlineNote> = {};
    notes.forEach((n) => (map[n.id] = n));
    return map;
  }, [notes]);

  function openMarker(noteId: string) {
    const note = notesById[noteId];
    if (!note || !contentRef.current) return;
    const span = contentRef.current.querySelector<HTMLElement>(
      `[data-note-id="${noteId}"]`
    );
    if (!span) return;
    onOpenNote(note, span.getBoundingClientRect());
  }

  return (
    <div className="group/scene relative">
      <div className="flex items-center justify-between border-b border-ink/10 pb-1">
        <span className="font-mono text-xs text-slate/70">
          Scene {scene.order + 1}
        </span>
        <SaveStatusIndicator sceneId={scene.id} />
      </div>

      {/* Wrapper relatif: kolom margin marker (desktop) diposisikan absolute
          terhadap ini. Mobile marker inline juga anchor ke sini. */}
      <div className="relative" ref={contentRef}>
        <EditorContent editor={editor} />

        {/* Marker kolom margin kanan — desktop (md+) saja. Diposisikan di luar
            lebar teks (canvas max-w-2xl, ada ruang di kanan pada md+). */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden md:block">
          {markers.map((mk) => (
            <button
              key={mk.noteId}
              type="button"
              onClick={() => openMarker(mk.noteId)}
              aria-label="Lihat catatan"
              style={{ top: mk.top }}
              className="pointer-events-auto absolute -right-7 -translate-y-1/2 rounded-full bg-brass/20 p-1 text-brass transition-colors hover:bg-brass/35 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brass"
            >
              <NoteIcon />
            </button>
          ))}
        </div>

        {/* Marker inline — mobile (< md) saja. Ikon kecil di ujung kanan baris
            span, di-posisikan absolute relatif ke wrapper (BUKAN karakter di
            HTML tersimpan). */}
        <div className="pointer-events-none absolute inset-0 md:hidden">
          {markers.map((mk) => (
            <button
              key={mk.noteId}
              type="button"
              onClick={() => openMarker(mk.noteId)}
              aria-label="Lihat catatan"
              style={{ top: mk.top }}
              className="pointer-events-auto absolute right-0 -translate-y-1/2 rounded-full bg-brass/25 p-0.5 text-brass focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brass"
            >
              <NoteIcon />
            </button>
          ))}
        </div>
      </div>

      <SelectionToolbar
        editor={editor}
        onCreate={(content) => (editor ? onCreateNote(editor, content) : Promise.resolve())}
      />
    </div>
  );
}

function NoteIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
    >
      <path d="M8 10h8M8 14h5" />
      <path d="M21 12a8 8 0 0 1-8 8H4l1.5-3A8 8 0 1 1 21 12z" />
    </svg>
  );
}

type EditorCanvasProps = {
  projectId: string;
  chapter: Chapter;
  scenes: Scene[];
  versions: ChapterVersion[];
  characters: Character[];
  worldbuilding: WorldbuildingEntry[];
  inlineNotesByScene: Record<string, InlineNote[]>;
};

export function EditorCanvas({
  projectId,
  chapter,
  scenes,
  versions,
  characters,
  worldbuilding,
  inlineNotesByScene,
}: EditorCanvasProps) {
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const resetEditorState = useEditorStore((s) => s.resetEditorState);
  const setEntityIndex = useEditorStore((s) => s.setEntityIndex);
  const setActiveNoteRef = useEditorStore((s) => s.setActiveNoteRef);
  const activeNoteRef = useEditorStore((s) => s.activeNoteRef);

  // Notes per scene sebagai state (source of truth React selama halaman
  // terbuka; server component sudah fetch awal, reload ambil ulang fresh).
  const [notesByScene, setNotesByScene] =
    useState<Record<string, InlineNote[]>>(inlineNotesByScene);

  // Registry editor per scene — buat strip mark dari editor yang benar saat
  // Hapus note (activeNoteRef nyimpen sceneId).
  const editorsRef = useRef<Record<string, Editor | null>>({});
  const onRegisterEditor = useCallback(
    (sceneId: string, editor: Editor | null) => {
      editorsRef.current[sceneId] = editor;
    },
    []
  );

  const entityIndex = useMemo(
    () => buildEntityIndex(characters, worldbuilding),
    [characters, worldbuilding]
  );

  useEffect(() => {
    setEntityIndex(entityIndex);
  }, [entityIndex, setEntityIndex]);

  useEffect(() => resetEditorState, [resetEditorState]);

  // Step 5: bikin note baru. createInlineNote → dapat noteId → apply mark ke
  // selection aktif. Mark persisten ke HTML → autosave scene simpan mark-nya.
  const handleCreateNote = useCallback(
    async (sceneId: string, editor: Editor, content: string) => {
      const result = await createInlineNote(sceneId, content);
      if ("error" in result) {
        // Best-effort UI: log; scene autosave tak terpengaruh.
        console.error("Gagal bikin catatan:", result.error);
        return;
      }
      editor.chain().focus().setInlineNote(result.id).run();
      setNotesByScene((prev) => ({
        ...prev,
        [sceneId]: [...(prev[sceneId] ?? []), result],
      }));
    },
    []
  );

  // Step 7: buka popover/sheet. Simpan sceneId juga (buat strip mark saat Hapus).
  const handleOpenNote = useCallback(
    (sceneId: string, note: InlineNote, rect: DOMRect) => {
      const editor = editorsRef.current[sceneId];
      const quotedText = editor
        ? quotedTextForNote(editor, note.id)
        : "";
      setActiveNoteRef({
        noteId: note.id,
        sceneId,
        content: note.content,
        quotedText,
        rect,
      });
    },
    [setActiveNoteRef]
  );

  // Step 6: reconciliation — hapus row yang mark-nya sudah hilang dari HTML.
  const handleReconcile = useCallback((sceneId: string, html: string) => {
    const activeIds = extractNoteIds(html);
    setNotesByScene((prev) => {
      const current = prev[sceneId] ?? [];
      const activeSet = new Set(activeIds);
      const kept = current.filter((n) => activeSet.has(n.id));
      // Cuma sinkron state lokal kalau memang ada yang orphan (hindari re-render).
      if (kept.length === current.length) return prev;
      return { ...prev, [sceneId]: kept };
    });
    // DB cleanup (best-effort, jangan blok autosave).
    void deleteOrphanedInlineNotes(sceneId, activeIds).catch((e) =>
      console.error("Gagal reconcile inline notes:", e)
    );
  }, []);

  const closeNote = useCallback(
    () => setActiveNoteRef(null),
    [setActiveNoteRef]
  );

  // Hapus note dari popover/sheet: hapus row DB + strip mark dari editornya +
  // buang dari state lokal.
  const handleDeleteNote = useCallback(async () => {
    if (!activeNoteRef) return;
    const { noteId, sceneId } = activeNoteRef;
    setDeleting(true);
    try {
      const result = await deleteInlineNote(noteId);
      if (result.error) {
        console.error("Gagal hapus catatan:", result.error);
        return;
      }
      editorsRef.current[sceneId]?.chain().focus().unsetInlineNoteById(noteId).run();
      setNotesByScene((prev) => ({
        ...prev,
        [sceneId]: (prev[sceneId] ?? []).filter((n) => n.id !== noteId),
      }));
      setActiveNoteRef(null);
    } finally {
      setDeleting(false);
    }
  }, [activeNoteRef, setActiveNoteRef]);

  return (
    <div className="flex h-full flex-col">
      <EditorToolbar
        editor={activeEditor}
        chapterId={chapter.id}
        historyOpen={historyOpen}
        onToggleHistory={() => setHistoryOpen(!historyOpen)}
      />

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto" onScroll={closeNote}>
          <div className="mx-auto w-full max-w-2xl px-6 py-8 md:px-10 md:py-12">
            <h2 className="mb-6 font-display text-3xl font-semibold text-ink">
              {chapter.title}
            </h2>

            {scenes.length === 0 ? (
              <p className="rounded border border-slate/30 border-dashed px-4 py-8 text-center text-sm text-slate">
                Belum ada scene — tambahkan lewat halaman Outline.
              </p>
            ) : (
              <div className="flex flex-col gap-8">
                {scenes.map((scene) => (
                  <SceneEditor
                    key={scene.id}
                    scene={scene}
                    entityIndex={entityIndex}
                    notes={notesByScene[scene.id] ?? []}
                    onFocus={setActiveEditor}
                    onRegisterEditor={onRegisterEditor}
                    onCreateNote={(editor, content) =>
                      handleCreateNote(scene.id, editor, content)
                    }
                    onReconcile={handleReconcile}
                    onOpenNote={(note, rect) =>
                      handleOpenNote(scene.id, note, rect)
                    }
                  />
                ))}
              </div>
            )}

            <div className="mt-8 border-t border-ink/10 pt-3">
              <WordCountBadge />
            </div>
          </div>
        </div>

        {historyOpen && (
          <VersionHistoryPanel
            chapterId={chapter.id}
            projectId={projectId}
            versions={versions}
            onClose={() => setHistoryOpen(false)}
          />
        )}
      </div>

      <EntityRefPopover />
      {/* Satu activeNoteRef, dua presentasi — CSS breakpoint pilih salah satu
          (pola md:hidden / hidden md:block sama seperti MobileNav/Sidebar). */}
      <NotePopover
        onDelete={handleDeleteNote}
        onClose={closeNote}
        deleting={deleting}
      />
      <NoteBottomSheet
        onDelete={handleDeleteNote}
        onClose={closeNote}
        deleting={deleting}
      />
    </div>
  );
}

// Ambil teks asli yang di-mark noteId ini (buat kutipan di popover/sheet).
// Digabung dari semua text node yang punya mark tsb (kalau kepecah).
function quotedTextForNote(editor: Editor, noteId: string): string {
  const markType = editor.state.schema.marks.inlineNote;
  if (!markType) return "";
  let text = "";
  editor.state.doc.descendants((node) => {
    if (
      node.isText &&
      node.marks.some(
        (m) => m.type === markType && m.attrs.noteId === noteId
      )
    ) {
      text += node.text ?? "";
    }
  });
  return text;
}
