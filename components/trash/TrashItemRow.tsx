"use client";

import { useTransition } from "react";
import type { TrashItem } from "@/lib/actions/trash";
import { permanentDelete, restoreItem } from "@/lib/actions/trash";

type TrashItemRowProps = {
  projectId: string;
  item: TrashItem;
  onError: (error: string | null) => void;
};

export function TrashItemRow({ projectId, item, onError }: TrashItemRowProps) {
  const [isPending, startTransition] = useTransition();

  const deletedAt = new Date(item.deleted_at).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  function handleRestore() {
    startTransition(async () => {
      const result = await restoreItem(item.type, item.id, projectId);
      onError(result.error);
    });
  }

  function handlePermanentDelete() {
    if (
      !confirm(
        `Hapus permanen "${item.label}"? Tindakan ini TIDAK bisa dibatalkan.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await permanentDelete(item.type, item.id, projectId);
      onError(result.error);
    });
  }

  return (
    <li className="flex items-center gap-3 rounded border border-ink/10 bg-parchment px-3 py-2 shadow-sm">
      <span className="min-w-0 flex-1 truncate text-sm text-ink">
        {item.label}
      </span>
      <span className="hidden shrink-0 font-mono text-xs text-slate/70 sm:inline">
        {deletedAt}
      </span>
      <button
        type="button"
        onClick={handleRestore}
        disabled={isPending}
        className="shrink-0 rounded border border-slate/40 px-2 py-0.5 font-mono text-xs text-slate transition-colors hover:border-wine hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine disabled:opacity-50"
      >
        Restore
      </button>
      <button
        type="button"
        onClick={handlePermanentDelete}
        disabled={isPending}
        className="shrink-0 rounded border border-wine/50 px-2 py-0.5 font-mono text-xs text-wine transition-colors hover:bg-wine/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine disabled:opacity-50"
      >
        Hapus permanen
      </button>
    </li>
  );
}
