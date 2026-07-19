"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store/useEditorStore";

// Satu instance di level EditorCanvas — posisi mengikuti activeEntityRef.rect
// dari store (position: fixed dari getBoundingClientRect span yang di-hover).
// Default muncul di atas span, flip ke bawah kalau kepotong viewport atas.
export function EntityRefPopover() {
  const activeEntityRef = useEditorStore((s) => s.activeEntityRef);
  const entityIndex = useEditorStore((s) => s.entityIndex);
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    visibility: "hidden",
  });

  useLayoutEffect(() => {
    if (!activeEntityRef || !cardRef.current) return;

    const { rect } = activeEntityRef;
    const card = cardRef.current.getBoundingClientRect();
    const GAP = 8;

    // Flip ke bawah kalau ruang di atas span tidak cukup.
    const top =
      rect.top - card.height - GAP < 0
        ? rect.bottom + GAP
        : rect.top - card.height - GAP;

    // Clamp horizontal biar tidak kepotong sisi viewport.
    const left = Math.min(
      Math.max(GAP, rect.left + rect.width / 2 - card.width / 2),
      window.innerWidth - card.width - GAP
    );

    setStyle({ top, left, visibility: "visible" });
  }, [activeEntityRef]);

  if (!activeEntityRef) return null;

  const entity = entityIndex.find(
    (e) =>
      e.id === activeEntityRef.entityId &&
      e.type === activeEntityRef.entityType
  );
  if (!entity) return null;

  const badge =
    entity.type === "character" ? "Karakter" : entity.category || "Worldbuilding";

  return (
    <div
      ref={cardRef}
      role="tooltip"
      style={{ position: "fixed", ...style }}
      className="pointer-events-none z-50 w-[230px] rounded-lg bg-ink px-3 py-2.5 text-parchment shadow-lg"
    >
      <span className="inline-block rounded bg-brass/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-brass">
        {badge}
      </span>
      <p className="mt-1.5 font-display text-sm font-semibold">{entity.name}</p>
      {entity.quickSummary && (
        <p className="mt-1 text-xs leading-relaxed text-parchment/80">
          {entity.quickSummary}
        </p>
      )}
    </div>
  );
}
