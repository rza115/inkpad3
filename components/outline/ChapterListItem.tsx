"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Chapter, ChapterStatus } from "@/lib/actions/chapters";
import {
  deleteChapter,
  renameChapter,
  updateChapterStatus,
} from "@/lib/actions/chapters";
import type { Scene } from "@/lib/actions/scenes";
import { SceneDragList } from "./SceneDragList";

const STATUS_LABELS: Record<ChapterStatus, string> = {
  draft: "Draft",
  revisi: "Revisi",
  selesai: "Selesai",
};

// Warna badge status — brass untuk highlight, sesuai guideline token
const STATUS_CLASSES: Record<ChapterStatus, string> = {
  draft: "border-slate/40 text-slate",
  revisi: "border-brass text-brass",
  selesai: "border-wine text-wine",
};

type ChapterListItemProps = {
  chapter: Chapter;
  projectId: string;
  scenes: Scene[];
};

export function ChapterListItem({
  chapter,
  projectId,
  scenes,
}: ChapterListItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(chapter.title);
  const [isPending, startTransition] = useTransition();

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  function handleStatusChange(status: ChapterStatus) {
    startTransition(() => {
      void updateChapterStatus(chapter.id, projectId, status);
    });
  }

  function handleRename(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await renameChapter(chapter.id, projectId, title);
      setRenaming(false);
    });
  }

  function handleDelete() {
    if (!confirm(`Hapus chapter "${chapter.title}"? (bisa dikembalikan dari Trash)`)) return;
    startTransition(() => {
      void deleteChapter(chapter.id, projectId);
    });
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative rounded-lg border border-ink/10 bg-parchment shadow-sm ${
        isDragging ? "z-10 opacity-80 shadow-md" : ""
      }`}
    >
      {/* Ribbon status — signature element di status chapter */}
      {chapter.status === "selesai" && (
        <span
          aria-hidden
          className="absolute -top-1 right-4 h-5 w-2.5 bg-wine [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]"
        />
      )}

      <div className="flex items-center gap-2 p-3">
        {/* Drag handle */}
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Geser chapter ${chapter.title}`}
          className="cursor-grab touch-none rounded p-1 text-slate/60 hover:bg-ink/5 hover:text-slate focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine active:cursor-grabbing"
        >
          <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="size-4">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>

        {/* Expand scene list */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Tutup" : "Buka"} scene ${chapter.title}`}
          className="rounded p-1 text-slate/60 hover:bg-ink/5 hover:text-slate focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`size-4 transition-transform ${expanded ? "rotate-90" : ""}`}
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        {renaming ? (
          <form onSubmit={handleRename} className="flex flex-1 items-center gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              onBlur={() => setRenaming(false)}
              onKeyDown={(e) => e.key === "Escape" && setRenaming(false)}
              className="flex-1 rounded border border-slate/40 bg-parchment px-2 py-1 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
            />
          </form>
        ) : (
          <Link
            href={`/${projectId}/editor/${chapter.id}`}
            className="min-w-0 flex-1 truncate font-display text-base font-semibold text-ink hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
          >
            {chapter.title}
          </Link>
        )}

        {/* Status selector — badge outline */}
        <select
          value={chapter.status}
          onChange={(e) => handleStatusChange(e.target.value as ChapterStatus)}
          disabled={isPending}
          aria-label={`Status chapter ${chapter.title}`}
          className={`rounded border bg-parchment px-2 py-1 font-mono text-xs focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine ${STATUS_CLASSES[chapter.status]}`}
        >
          {(Object.keys(STATUS_LABELS) as ChapterStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <Link
          href={`/${projectId}/read/${chapter.id}`}
          aria-label={`Baca chapter ${chapter.title}`}
          className="rounded p-1 text-slate/60 hover:bg-ink/5 hover:text-slate focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
        >
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="M12 6.25C10 4.75 7.5 4 4 4v15c3.5 0 6 .75 8 2.25 2-1.5 4.5-2.25 8-2.25V4c-3.5 0-6 .75-8 2.25zm0 0v15" />
          </svg>
        </Link>

        <button
          type="button"
          onClick={() => setRenaming(true)}
          aria-label={`Rename chapter ${chapter.title}`}
          className="rounded p-1 text-slate/60 hover:bg-ink/5 hover:text-slate focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
        >
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleDelete}
          aria-label={`Hapus chapter ${chapter.title}`}
          className="rounded p-1 text-slate/60 hover:bg-wine/10 hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
        >
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="border-t border-ink/10 px-3 pt-2 pb-3 pl-11">
          <SceneDragList
            chapterId={chapter.id}
            projectId={projectId}
            scenes={scenes}
          />
        </div>
      )}
    </li>
  );
}
