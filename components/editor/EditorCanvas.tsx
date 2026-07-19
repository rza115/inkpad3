"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Chapter } from "@/lib/actions/chapters";
import type { Scene } from "@/lib/actions/scenes";
import { updateSceneContent } from "@/lib/actions/scenes";
import type { ChapterVersion } from "@/lib/actions/versions";
import type { Character } from "@/lib/actions/characters";
import type { WorldbuildingEntry } from "@/lib/actions/worldbuilding";
import { buildEntityIndex, type EntityRef } from "@/lib/editor/entityIndex";
import { useDebouncedSave } from "@/lib/hooks/useDebouncedSave";
import { useEditorStore } from "@/store/useEditorStore";
import { EntityReference } from "./extensions/entityReference";
import { EntityRefPopover } from "./EntityRefPopover";
import { EditorToolbar } from "./EditorToolbar";
import { WordCountBadge } from "./WordCountBadge";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import { VersionHistoryPanel } from "./VersionHistoryPanel";

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// Satu instance TipTap per scene, semua scene ditumpuk berurutan di satu
// canvas parchment (keputusan user: continuous view). Draft hidup di TipTap
// selama halaman terbuka; autosave debounced per scene ke Supabase.
function SceneEditor({
  scene,
  entityIndex,
  onFocus,
}: {
  scene: Scene;
  entityIndex: EntityRef[];
  onFocus: (editor: Editor) => void;
}) {
  const { scheduleSave } = useDebouncedSave(scene.id, updateSceneContent);
  const setWordCount = useEditorStore((s) => s.setWordCount);

  const editor = useEditor({
    extensions: [
      StarterKit,
      EntityReference.configure({ entityIndex }),
    ],
    content: scene.content || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-inkpad min-h-24 max-w-none px-1 py-2 focus:outline-none",
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

  // Refresh index tanpa remount kalau characters/worldbuilding berubah
  // (configure() cuma kebaca saat init).
  useEffect(() => {
    if (editor) {
      editor.commands.updateEntityIndex(entityIndex);
    }
  }, [editor, entityIndex]);

  return (
    <div className="group/scene relative">
      <div className="flex items-center justify-between border-b border-ink/10 pb-1">
        <span className="font-mono text-xs text-slate/70">
          Scene {scene.order + 1}
        </span>
        <SaveStatusIndicator sceneId={scene.id} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

const LONG_PRESS_MS = 450;

type EditorCanvasProps = {
  projectId: string;
  chapter: Chapter;
  scenes: Scene[];
  versions: ChapterVersion[];
  characters: Character[];
  worldbuilding: WorldbuildingEntry[];
};

export function EditorCanvas({
  projectId,
  chapter,
  scenes,
  versions,
  characters,
  worldbuilding,
}: EditorCanvasProps) {
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const resetEditorState = useEditorStore((s) => s.resetEditorState);
  const setEntityIndex = useEditorStore((s) => s.setEntityIndex);
  const setActiveEntityRef = useEditorStore((s) => s.setActiveEntityRef);

  const entityIndex = useMemo(
    () => buildEntityIndex(characters, worldbuilding),
    [characters, worldbuilding]
  );

  // Index ke store supaya EntityRefPopover bisa lookup tanpa fetch ulang.
  useEffect(() => {
    setEntityIndex(entityIndex);
  }, [entityIndex, setEntityIndex]);

  // Bersihkan status/word count pas pindah chapter/halaman
  useEffect(() => resetEditorState, [resetEditorState]);

  // Long-press touch (Editor = contentEditable: tap singkat tetap taruh
  // cursor, popover cuma dari press ≥450ms). Span aktif dikasih class .open.
  const longPressTimer = useRef<number | null>(null);
  const openSpanRef = useRef<HTMLElement | null>(null);
  // Guard: mouseover sintetis pasca-tap di touch device jangan buka popover.
  const lastPointerWasTouch = useRef(false);

  function openPopover(span: HTMLElement, viaTouch: boolean) {
    const entityId = span.dataset.entityId;
    const entityType = span.dataset.entityType;
    if (!entityId || (entityType !== "character" && entityType !== "worldbuilding")) {
      return;
    }
    if (viaTouch) {
      openSpanRef.current?.classList.remove("open");
      span.classList.add("open");
      openSpanRef.current = span;
    }
    setActiveEntityRef({
      entityId,
      entityType,
      rect: span.getBoundingClientRect(),
    });
  }

  function closePopover() {
    openSpanRef.current?.classList.remove("open");
    openSpanRef.current = null;
    setActiveEntityRef(null);
  }

  function cancelLongPress() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  // Event delegation di wrapper canvas (bukan per-span) — lebih murah
  // daripada attach listener ke tiap span decoration.
  function handleMouseOver(e: React.MouseEvent) {
    if (lastPointerWasTouch.current) return;
    const span = (e.target as HTMLElement).closest<HTMLElement>(".ref");
    if (span) openPopover(span, false);
  }

  function handleMouseOut(e: React.MouseEvent) {
    if (lastPointerWasTouch.current) return;
    const span = (e.target as HTMLElement).closest<HTMLElement>(".ref");
    if (!span) return;
    // Masih di dalam span yang sama (pindah antar text node) → biarkan.
    if (span.contains(e.relatedTarget as Node | null)) return;
    closePopover();
  }

  function handlePointerDown(e: React.PointerEvent) {
    lastPointerWasTouch.current = e.pointerType === "touch";
    if (e.pointerType !== "touch") return;

    cancelLongPress();
    const span = (e.target as HTMLElement).closest<HTMLElement>(".ref");
    if (!span) {
      // Tap di luar span .ref → tutup popover yang lagi kebuka.
      closePopover();
      return;
    }
    longPressTimer.current = window.setTimeout(() => {
      longPressTimer.current = null;
      openPopover(span, true);
    }, LONG_PRESS_MS);
  }

  return (
    <div className="flex h-full flex-col">
      <EditorToolbar
        editor={activeEditor}
        chapterId={chapter.id}
        historyOpen={historyOpen}
        onToggleHistory={() => setHistoryOpen(!historyOpen)}
      />

      <div className="flex min-h-0 flex-1">
        {/* Canvas manuskrip: parchment, margin lebar, bukan full-bleed */}
        <div
          className="min-w-0 flex-1 overflow-y-auto"
          onScroll={closePopover}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          onPointerDown={handlePointerDown}
          onPointerUp={cancelLongPress}
          onPointerMove={cancelLongPress}
          onPointerCancel={cancelLongPress}
        >
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
                    onFocus={setActiveEditor}
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
    </div>
  );
}
