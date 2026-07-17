"use client";

import { useState } from "react";
import type { TrashEntityType, TrashItem } from "@/lib/actions/trash";
import { TrashItemRow } from "./TrashItemRow";

const TYPE_LABELS: Record<TrashEntityType, string> = {
  chapter: "Chapters",
  scene: "Scenes",
  note: "Notes",
  character: "Characters",
  plot_point: "Plot points",
  worldbuilding_entry: "Worldbuilding",
  illustration: "Illustrations",
};

// Urutan tampilan grup
const TYPE_ORDER: TrashEntityType[] = [
  "chapter",
  "scene",
  "note",
  "character",
  "plot_point",
  "worldbuilding_entry",
  "illustration",
];

type TrashListProps = {
  projectId: string;
  items: TrashItem[];
};

export function TrashList({ projectId, items }: TrashListProps) {
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="rounded border border-slate/30 border-dashed px-4 py-8 text-center text-sm text-slate">
        Trash kosong.
      </p>
    );
  }

  const groups = TYPE_ORDER.map((type) => ({
    type,
    items: items.filter((i) => i.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="rounded border border-wine/40 bg-wine/10 px-3 py-2 text-sm text-wine">
          {error}
        </p>
      )}

      {groups.map((group) => (
        <section key={group.type} className="flex flex-col gap-2">
          <h3 className="font-mono text-xs font-semibold tracking-wide text-slate uppercase">
            {TYPE_LABELS[group.type]} ({group.items.length})
          </h3>
          <ul className="flex flex-col gap-1.5">
            {group.items.map((item) => (
              <TrashItemRow
                key={`${item.type}-${item.id}`}
                projectId={projectId}
                item={item}
                onError={setError}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
