"use client";

import { useState, useTransition } from "react";
import type { WorldbuildingEntry } from "@/lib/actions/worldbuilding";
import {
  createWorldbuildingEntry,
  updateWorldbuildingEntry,
} from "@/lib/actions/worldbuilding";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type WorldbuildingEntryFormProps = {
  projectId: string;
  // Ada entry = mode edit, tidak ada = mode create (pola CharacterForm)
  entry?: WorldbuildingEntry;
  onDone?: () => void;
};

export function WorldbuildingEntryForm({
  projectId,
  entry,
  onDone,
}: WorldbuildingEntryFormProps) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [category, setCategory] = useState(entry?.category ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  // Aliases diedit sebagai string dipisah koma, di-parse jadi array saat submit.
  const [aliasesText, setAliasesText] = useState(entry?.aliases.join(", ") ?? "");
  const [quickSummary, setQuickSummary] = useState(entry?.quick_summary ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const fields = {
        title,
        category,
        content,
        aliases: aliasesText
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        quick_summary: quickSummary,
      };
      const result = entry
        ? await updateWorldbuildingEntry(entry.id, projectId, fields)
        : await createWorldbuildingEntry(projectId, fields);

      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        if (!entry) {
          setTitle("");
          setCategory("");
          setContent("");
          setAliasesText("");
          setQuickSummary("");
        }
        onDone?.();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="rounded border border-wine/40 bg-wine/10 px-3 py-2 text-sm text-wine">
          {error}
        </p>
      )}

      <Input
        label="Judul"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nama lokasi / faksi / lore…"
        required
        disabled={isPending}
      />

      <Input
        label="Kategori"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="lokasi / faksi / sistem / lore…"
        required
        disabled={isPending}
        list="worldbuilding-categories"
      />

      <Input
        label="Alias (pisahkan dengan koma)"
        value={aliasesText}
        onChange={(e) => setAliasesText(e.target.value)}
        placeholder="Nama lain entry ini…"
        disabled={isPending}
      />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate">Isi</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          placeholder="Deskripsi entry…"
          disabled={isPending}
          className="w-full resize-y rounded border border-slate/40 bg-parchment px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-slate/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate">
          Ringkasan singkat (untuk popover referensi)
        </span>
        <textarea
          value={quickSummary}
          onChange={(e) => setQuickSummary(e.target.value)}
          rows={2}
          maxLength={140}
          placeholder="1–2 kalimat ringkasan…"
          disabled={isPending}
          className="w-full resize-y rounded border border-slate/40 bg-parchment px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-slate/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
        />
        <span className="self-end font-mono text-xs text-slate/70">
          {140 - quickSummary.length} karakter tersisa
        </span>
      </label>

      <Button
        type="submit"
        disabled={isPending || !title.trim() || !category.trim()}
      >
        {entry ? "Simpan" : "Tambah entry"}
      </Button>
    </form>
  );
}
