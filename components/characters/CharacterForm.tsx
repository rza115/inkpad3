"use client";

import { useState, useTransition } from "react";
import type { Character, CharacterRole } from "@/lib/actions/characters";
import { createCharacter, updateCharacter } from "@/lib/actions/characters";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type CharacterFormProps = {
  projectId: string;
  // Ada character = mode edit, tidak ada = mode create
  character?: Character;
  onDone?: () => void;
};

// Shared create & edit — validasi & field tidak duplikat (catatan breakdown).
export function CharacterForm({
  projectId,
  character,
  onDone,
}: CharacterFormProps) {
  const [name, setName] = useState(character?.name ?? "");
  const [description, setDescription] = useState(character?.description ?? "");
  const [role, setRole] = useState<CharacterRole>(character?.role ?? "side");
  const [arcNotes, setArcNotes] = useState(character?.arc_notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const fields = { name, description, role, arc_notes: arcNotes };
      const result = character
        ? await updateCharacter(character.id, projectId, fields)
        : await createCharacter(projectId, fields);

      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        if (!character) {
          setName("");
          setDescription("");
          setRole("side");
          setArcNotes("");
        } else {
          setSavedMsg(true);
          setTimeout(() => setSavedMsg(false), 3000);
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
        label="Nama"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama karakter…"
        required
        disabled={isPending}
      />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate">Role</span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as CharacterRole)}
          disabled={isPending}
          className="rounded border border-slate/40 bg-parchment px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
        >
          <option value="protagonist">Protagonist</option>
          <option value="antagonist">Antagonist</option>
          <option value="side">Side</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate">Deskripsi</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Penampilan, sifat, latar belakang…"
          disabled={isPending}
          className="w-full resize-y rounded border border-slate/40 bg-parchment px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-slate/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate">Arc notes</span>
        <textarea
          value={arcNotes}
          onChange={(e) => setArcNotes(e.target.value)}
          rows={3}
          placeholder="Perkembangan karakter sepanjang cerita…"
          disabled={isPending}
          className="w-full resize-y rounded border border-slate/40 bg-parchment px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-slate/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
        />
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending || !name.trim()}>
          {character ? "Simpan" : "Tambah karakter"}
        </Button>
        {savedMsg && (
          <span role="status" className="font-mono text-xs text-brass">
            ✓ Tersimpan
          </span>
        )}
      </div>
    </form>
  );
}
