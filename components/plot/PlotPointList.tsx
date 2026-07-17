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
import type { PlotPoint } from "@/lib/actions/plot";
import { createPlotPoint, updatePlotPointOrder } from "@/lib/actions/plot";
import type { Chapter } from "@/lib/actions/chapters";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlotPointItem } from "./PlotPointItem";

type PlotPointListProps = {
  projectId: string;
  plotPoints: PlotPoint[];
  chapters: Chapter[];
};

// Pola sama dengan ChapterList: optimistic reorder + rollback kalau gagal.
export function PlotPointList({
  projectId,
  plotPoints,
  chapters,
}: PlotPointListProps) {
  const [ordered, setOrdered] = useState(plotPoints);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOrdered(plotPoints);
  }, [plotPoints]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ordered.findIndex((p) => p.id === active.id);
    const newIndex = ordered.findIndex((p) => p.id === over.id);
    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next);

    startTransition(async () => {
      const result = await updatePlotPointOrder(
        projectId,
        next.map((p) => p.id)
      );
      if (result.error) {
        setError(result.error);
        setOrdered(plotPoints);
      } else {
        setError(null);
      }
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    startTransition(async () => {
      const result = await createPlotPoint(projectId, newTitle);
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
          Belum ada plot point — tambahkan yang pertama di bawah.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ordered.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-2">
              {ordered.map((point) => (
                <PlotPointItem
                  key={point.id}
                  point={point}
                  projectId={projectId}
                  chapters={chapters}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <form onSubmit={handleCreate} className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Plot point baru"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Judul plot point…"
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
