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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Scene } from "@/lib/actions/scenes";
import { createScene, deleteScene, updateSceneOrder } from "@/lib/actions/scenes";

// Ringkas isi scene (HTML TipTap) jadi teks pendek buat label list
function excerpt(html: string): string {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return "(kosong)";
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

function SceneRow({
  scene,
  index,
  projectId,
  isPending,
  onDelete,
}: {
  scene: Scene;
  index: number;
  projectId: string;
  isPending: boolean;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id });
  void projectId;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded border border-ink/10 bg-parchment px-2 py-1.5 ${
        isDragging ? "z-10 opacity-80 shadow" : ""
      }`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Geser scene ${index + 1}`}
        className="cursor-grab touch-none rounded p-0.5 text-slate/50 hover:text-slate focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine active:cursor-grabbing"
      >
        <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>

      <span className="shrink-0 font-mono text-xs text-slate">
        Scene {index + 1}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-ink/80">
        {excerpt(scene.content)}
      </span>

      <button
        type="button"
        onClick={() => onDelete(scene.id)}
        disabled={isPending}
        aria-label={`Hapus scene ${index + 1}`}
        className="rounded p-0.5 text-slate/50 hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
      >
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" />
        </svg>
      </button>
    </li>
  );
}

type SceneDragListProps = {
  chapterId: string;
  projectId: string;
  scenes: Scene[];
};

export function SceneDragList({
  chapterId,
  projectId,
  scenes,
}: SceneDragListProps) {
  const [ordered, setOrdered] = useState(scenes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOrdered(scenes);
  }, [scenes]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ordered.findIndex((s) => s.id === active.id);
    const newIndex = ordered.findIndex((s) => s.id === over.id);
    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next);

    startTransition(async () => {
      const result = await updateSceneOrder(
        chapterId,
        projectId,
        next.map((s) => s.id)
      );
      if (result.error) {
        setError(result.error);
        setOrdered(scenes);
      } else {
        setError(null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Hapus scene ini? (bisa dikembalikan dari Trash)")) return;
    startTransition(async () => {
      const result = await deleteScene(id, projectId);
      setError(result.error);
    });
  }

  function handleCreate() {
    startTransition(async () => {
      const result = await createScene(chapterId, projectId);
      setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p role="alert" className="rounded border border-wine/40 bg-wine/10 px-2 py-1 text-xs text-wine">
          {error}
        </p>
      )}

      {ordered.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ordered.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-1">
              {ordered.map((scene, index) => (
                <SceneRow
                  key={scene.id}
                  scene={scene}
                  index={index}
                  projectId={projectId}
                  isPending={isPending}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={isPending}
        className="self-start rounded px-2 py-1 text-xs font-medium text-wine hover:bg-wine/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine disabled:opacity-50"
      >
        + Tambah scene
      </button>
    </div>
  );
}
