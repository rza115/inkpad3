"use client";

import { useState, useTransition } from "react";
import type { Note } from "@/lib/actions/notes";
import { createNote, deleteNote } from "@/lib/actions/notes";
import type { Chapter } from "@/lib/actions/chapters";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NoteEditor } from "./NoteEditor";

type NoteListProps = {
  projectId: string;
  notes: Note[];
  chapters: Chapter[];
};

export function NoteList({ projectId, notes, chapters }: NoteListProps) {
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const chapterTitleById = new Map(chapters.map((c) => [c.id, c.title]));

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    startTransition(async () => {
      const result = await createNote(projectId, newTitle);
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        setNewTitle("");
      }
    });
  }

  function handleDelete(note: Note) {
    if (!confirm(`Hapus note "${note.title}"? (bisa dikembalikan dari Trash)`)) return;
    startTransition(async () => {
      const result = await deleteNote(note.id, projectId);
      setError(result.error);
      if (openNoteId === note.id) setOpenNoteId(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="rounded border border-wine/40 bg-wine/10 px-3 py-2 text-sm text-wine">
          {error}
        </p>
      )}

      {notes.length === 0 ? (
        <p className="rounded border border-slate/30 border-dashed px-4 py-8 text-center text-sm text-slate">
          Belum ada note — tambahkan yang pertama di bawah.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-ink/10 bg-parchment shadow-sm"
            >
              <div className="flex items-center gap-2 p-3">
                <button
                  type="button"
                  onClick={() =>
                    setOpenNoteId(openNoteId === note.id ? null : note.id)
                  }
                  aria-expanded={openNoteId === note.id}
                  className="min-w-0 flex-1 truncate text-left font-display text-base font-semibold text-ink hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                >
                  {note.title}
                </button>

                {note.linked_chapter_id &&
                  chapterTitleById.has(note.linked_chapter_id) && (
                    <span className="shrink-0 rounded border border-brass px-1.5 py-0.5 font-mono text-xs text-brass">
                      {chapterTitleById.get(note.linked_chapter_id)}
                    </span>
                  )}

                <button
                  type="button"
                  onClick={() => handleDelete(note)}
                  disabled={isPending}
                  aria-label={`Hapus note ${note.title}`}
                  className="rounded p-1 text-slate/60 hover:bg-wine/10 hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
                >
                  <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" />
                  </svg>
                </button>
              </div>

              {openNoteId === note.id && (
                <div className="border-t border-ink/10 p-3">
                  <NoteEditor
                    note={note}
                    projectId={projectId}
                    chapters={chapters}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleCreate} className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Note baru"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Judul note…"
            disabled={isPending}
          />
        </div>
        <Button type="submit" disabled={isPending || !newTitle.trim()}>
          Tambah
        </Button>
      </form>
    </div>
  );
}
