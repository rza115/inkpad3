"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Chapter } from "@/lib/actions/chapters";
import { createChapter, updateChapterOrder } from "@/lib/actions/chapters";
import type { Scene } from "@/lib/actions/scenes";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChapterListItem } from "./ChapterListItem";

type ChapterListProps = {
  projectId: string;
  chapters: Chapter[];
  scenesByChapter: Record<string, Scene[]>;
};

export function ChapterList({
  projectId,
  chapters,
  scenesByChapter,
}: ChapterListProps) {
  // Urutan lokal cuma buat feedback drag instan; server (revalidate) tetap
  // source of truth — di-sync balik tiap props berubah.
  const [ordered, setOrdered] = useState(chapters);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOrdered(chapters);
  }, [chapters]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ordered.findIndex((c) => c.id === active.id);
    const newIndex = ordered.findIndex((c) => c.id === over.id);
    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next);

    startTransition(async () => {
      const result = await updateChapterOrder(
        projectId,
        next.map((c) => c.id)
      );
      if (result.error) {
        setError(result.error);
        setOrdered(chapters); // balikin urutan dari server
      } else {
        setError(null);
      }
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    startTransition(async () => {
      const result = await createChapter(projectId, newTitle);
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        setNewTitle("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="rounded border border-wine/40 bg-wine/10 px-3 py-2 text-sm text-wine">
          {error}
        </p>
      )}

      {ordered.length === 0 ? (
        <p className="rounded border border-slate/30 border-dashed px-4 py-8 text-center text-sm text-slate">
          Belum ada chapter — tambahkan yang pertama di bawah.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ordered.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-2">
              {ordered.map((chapter) => (
                <ChapterListItem
                  key={chapter.id}
                  chapter={chapter}
                  projectId={projectId}
                  scenes={scenesByChapter[chapter.id] ?? []}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <form onSubmit={handleCreate} className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Chapter baru"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Judul chapter…"
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
