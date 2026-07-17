"use client";

import { useState, useTransition } from "react";
import type { WorldbuildingEntry } from "@/lib/actions/worldbuilding";
import { deleteWorldbuildingEntry } from "@/lib/actions/worldbuilding";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CategoryFilter } from "./CategoryFilter";
import { WorldbuildingEntryForm } from "./WorldbuildingEntryForm";

type WorldbuildingListProps = {
  projectId: string;
  entries: WorldbuildingEntry[];
};

export function WorldbuildingList({
  projectId,
  entries,
}: WorldbuildingListProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorldbuildingEntry | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categories = [...new Set(entries.map((e) => e.category))].sort();
  const filtered = activeCategory
    ? entries.filter((e) => e.category === activeCategory)
    : entries;

  function handleDelete(entry: WorldbuildingEntry) {
    if (!confirm(`Hapus entry "${entry.title}"? (bisa dikembalikan dari Trash)`))
      return;
    startTransition(async () => {
      const result = await deleteWorldbuildingEntry(entry.id, projectId);
      setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />
        <Button
          type="button"
          onClick={() => {
            setEditingEntry(null);
            setFormOpen(true);
          }}
        >
          + Entry baru
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded border border-wine/40 bg-wine/10 px-3 py-2 text-sm text-wine">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded border border-slate/30 border-dashed px-4 py-8 text-center text-sm text-slate">
          {entries.length === 0
            ? "Belum ada entry — tambahkan lokasi, faksi, atau lore pertama."
            : "Tidak ada entry di kategori ini."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-1.5 rounded-lg border border-ink/10 bg-parchment p-3 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingEntry(entry);
                    setFormOpen(true);
                  }}
                  className="min-w-0 flex-1 truncate text-left font-display text-base font-semibold text-ink hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                >
                  {entry.title}
                </button>
                <span className="shrink-0 rounded border border-brass px-1.5 py-0.5 font-mono text-xs text-brass">
                  {entry.category}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(entry)}
                  disabled={isPending}
                  aria-label={`Hapus entry ${entry.title}`}
                  className="rounded p-1 text-slate/60 hover:bg-wine/10 hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
                >
                  <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" />
                  </svg>
                </button>
              </div>
              {entry.content && (
                <p className="line-clamp-2 text-sm text-ink/70">
                  {entry.content}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingEntry ? "Edit entry" : "Entry baru"}
      >
        <WorldbuildingEntryForm
          key={editingEntry?.id ?? "new"}
          projectId={projectId}
          entry={editingEntry ?? undefined}
          onDone={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
