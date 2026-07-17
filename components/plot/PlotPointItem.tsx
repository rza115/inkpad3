"use client";

import { useState, useTransition } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PlotPoint, PlotStatus } from "@/lib/actions/plot";
import { deletePlotPoint, updatePlotPoint } from "@/lib/actions/plot";
import type { Chapter } from "@/lib/actions/chapters";

const STATUS_LABELS: Record<PlotStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  resolved: "Resolved",
};

const STATUS_CLASSES: Record<PlotStatus, string> = {
  planned: "border-slate/40 text-slate",
  in_progress: "border-brass text-brass",
  resolved: "border-wine text-wine",
};

type PlotPointItemProps = {
  point: PlotPoint;
  projectId: string;
  chapters: Chapter[];
};

export function PlotPointItem({
  point,
  projectId,
  chapters,
}: PlotPointItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState(point.description);
  const [isPending, startTransition] = useTransition();

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: point.id });

  const chapterTitleById = new Map(chapters.map((c) => [c.id, c.title]));

  function handleStatusChange(status: PlotStatus) {
    startTransition(() => {
      void updatePlotPoint(point.id, projectId, { status });
    });
  }

  function handleLinkChange(chapterId: string) {
    startTransition(() => {
      void updatePlotPoint(point.id, projectId, {
        linked_chapter_id: chapterId || null,
      });
    });
  }

  function handleDescriptionBlur() {
    if (description === point.description) return;
    startTransition(() => {
      void updatePlotPoint(point.id, projectId, { description });
    });
  }

  function handleDelete() {
    if (!confirm(`Hapus plot point "${point.title}"? (bisa dikembalikan dari Trash)`))
      return;
    startTransition(() => {
      void deletePlotPoint(point.id, projectId);
    });
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border border-ink/10 bg-parchment shadow-sm ${
        isDragging ? "z-10 opacity-80 shadow-md" : ""
      }`}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Geser plot point ${point.title}`}
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

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="min-w-0 flex-1 truncate text-left font-display text-base font-semibold text-ink hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
        >
          {point.title}
        </button>

        {point.linked_chapter_id &&
          chapterTitleById.has(point.linked_chapter_id) && (
            <span className="hidden shrink-0 rounded border border-brass px-1.5 py-0.5 font-mono text-xs text-brass sm:inline">
              {chapterTitleById.get(point.linked_chapter_id)}
            </span>
          )}

        <select
          value={point.status}
          onChange={(e) => handleStatusChange(e.target.value as PlotStatus)}
          disabled={isPending}
          aria-label={`Status plot point ${point.title}`}
          className={`rounded border bg-parchment px-2 py-1 font-mono text-xs focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine ${STATUS_CLASSES[point.status]}`}
        >
          {(Object.keys(STATUS_LABELS) as PlotStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-label={`Hapus plot point ${point.title}`}
          className="rounded p-1 text-slate/60 hover:bg-wine/10 hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
        >
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-2 border-t border-ink/10 p-3">
          <label className="flex items-center gap-2 text-sm text-slate">
            <span className="shrink-0">Link ke chapter:</span>
            <select
              value={point.linked_chapter_id ?? ""}
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

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            rows={3}
            placeholder="Deskripsi plot point…"
            aria-label={`Deskripsi plot point ${point.title}`}
            className="w-full resize-y rounded border border-slate/40 bg-parchment px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-slate/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
          />
        </div>
      )}
    </li>
  );
}
