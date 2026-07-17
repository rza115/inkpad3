"use client";

import { useTransition } from "react";
import type { Note } from "@/lib/actions/notes";
import { updateNote, updateNoteContent } from "@/lib/actions/notes";
import type { Chapter } from "@/lib/actions/chapters";
import { useDebouncedSave } from "@/lib/hooks/useDebouncedSave";
import { SaveStatusIndicator } from "@/components/editor/SaveStatusIndicator";

type NoteEditorProps = {
  note: Note;
  projectId: string;
  chapters: Chapter[];
};

// Konten note = textarea + autosave debounced (reuse useDebouncedSave &
// SaveStatusIndicator dari editor). Link ke chapter opsional via select.
export function NoteEditor({ note, projectId, chapters }: NoteEditorProps) {
  const { scheduleSave } = useDebouncedSave(note.id, updateNoteContent);
  const [isPending, startTransition] = useTransition();

  function handleLinkChange(chapterId: string) {
    startTransition(() => {
      void updateNote(note.id, projectId, {
        linked_chapter_id: chapterId || null,
      });
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-slate">
          <span className="shrink-0">Link ke chapter:</span>
          <select
            defaultValue={note.linked_chapter_id ?? ""}
            onChange={(e) => handleLinkChange(e.target.value)}
            disabled={isPending}
            className="rounded border border-slate/40 bg-parchment px-2 py-1 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
          >
            <option value="">— tidak ada —</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <SaveStatusIndicator sceneId={note.id} />
      </div>

      <textarea
        defaultValue={note.content}
        onChange={(e) => scheduleSave(e.target.value)}
        rows={6}
        placeholder="Tulis catatan di sini…"
        aria-label={`Isi note ${note.title}`}
        className="w-full resize-y rounded border border-slate/40 bg-parchment px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-slate/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
      />
    </div>
  );
}
