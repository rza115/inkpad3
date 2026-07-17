"use client";

import { useState, useTransition } from "react";
import type { Character } from "@/lib/actions/characters";
import { createRelationship } from "@/lib/actions/relationships";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

type RelationshipFormModalProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  character: Character;
  allCharacters: Character[];
};

export function RelationshipFormModal({
  open,
  onClose,
  projectId,
  character,
  allCharacters,
}: RelationshipFormModalProps) {
  const [relatedId, setRelatedId] = useState("");
  const [type, setType] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const others = allCharacters.filter((c) => c.id !== character.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createRelationship(
        projectId,
        character.id,
        relatedId,
        type,
        notes
      );
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        setRelatedId("");
        setType("");
        setNotes("");
        onClose();
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah relasi">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && (
          <p role="alert" className="rounded border border-wine/40 bg-wine/10 px-3 py-2 text-sm text-wine">
            {error}
          </p>
        )}

        {others.length === 0 ? (
          <p className="text-sm text-slate">
            Belum ada karakter lain untuk dihubungkan.
          </p>
        ) : (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate">Karakter</span>
              <select
                value={relatedId}
                onChange={(e) => setRelatedId(e.target.value)}
                required
                disabled={isPending}
                className="rounded border border-slate/40 bg-parchment px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
              >
                <option value="">— pilih karakter —</option>
                {others.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="Tipe relasi"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="keluarga / rival / mentor / pasangan…"
              required
              disabled={isPending}
            />

            <Input
              label="Catatan (opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail hubungan…"
              disabled={isPending}
            />

            <Button
              type="submit"
              disabled={isPending || !relatedId || !type.trim()}
            >
              Simpan relasi
            </Button>
          </>
        )}
      </form>
    </Modal>
  );
}
