"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Chapter } from "@/lib/actions/chapters";
import type { Scene } from "@/lib/actions/scenes";
import { updateSceneContent } from "@/lib/actions/scenes";
import type { ChapterVersion } from "@/lib/actions/versions";
import { useDebouncedSave } from "@/lib/hooks/useDebouncedSave";
import { useEditorStore } from "@/store/useEditorStore";
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
  onFocus,
}: {
  scene: Scene;
  onFocus: (editor: Editor) => void;
}) {
  const { scheduleSave } = useDebouncedSave(scene.id, updateSceneContent);
  const setWordCount = useEditorStore((s) => s.setWordCount);

  const editor = useEditor({
    extensions: [StarterKit],
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

type EditorCanvasProps = {
  projectId: string;
  chapter: Chapter;
  scenes: Scene[];
  versions: ChapterVersion[];
};

export function EditorCanvas({
  projectId,
  chapter,
  scenes,
  versions,
}: EditorCanvasProps) {
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const resetEditorState = useEditorStore((s) => s.resetEditorState);

  // Bersihkan status/word count pas pindah chapter/halaman
  useEffect(() => resetEditorState, [resetEditorState]);

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
        <div className="min-w-0 flex-1 overflow-y-auto">
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
    </div>
  );
}
