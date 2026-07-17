"use client";

import { useState, useTransition } from "react";
import type { Character } from "@/lib/actions/characters";
import type { CharacterRelationship } from "@/lib/actions/relationships";
import { deleteRelationship } from "@/lib/actions/relationships";
import { Button } from "@/components/ui/Button";
import { RelationshipFormModal } from "./RelationshipFormModal";

type RelationshipListProps = {
  projectId: string;
  character: Character;
  relationships: CharacterRelationship[];
  allCharacters: Character[];
};

// Daftar relasi dua arah di detail karakter. Visual graph = opsional fase
// belakangan; minimal list sesuai konsep.
export function RelationshipList({
  projectId,
  character,
  relationships,
  allCharacters,
}: RelationshipListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nameById = new Map(allCharacters.map((c) => [c.id, c.name]));

  function otherName(rel: CharacterRelationship): string {
    const otherId =
      rel.character_id === character.id
        ? rel.related_character_id
        : rel.character_id;
    return nameById.get(otherId) ?? "(karakter terhapus)";
  }

  function handleDelete(rel: CharacterRelationship) {
    if (!confirm(`Hapus relasi "${rel.relationship_type}" dengan ${otherName(rel)}?`))
      return;
    startTransition(async () => {
      const result = await deleteRelationship(rel.id, projectId);
      setError(result.error);
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">
          Relationships
        </h3>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setFormOpen(true)}
        >
          + Tambah relasi
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded border border-wine/40 bg-wine/10 px-3 py-2 text-sm text-wine">
          {error}
        </p>
      )}

      {relationships.length === 0 ? (
        <p className="rounded border border-slate/30 border-dashed px-4 py-6 text-center text-sm text-slate">
          Belum ada relasi — hubungkan karakter ini dengan yang lain.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {relationships.map((rel) => (
            <li
              key={rel.id}
              className="flex items-center gap-3 rounded-lg border border-ink/10 bg-parchment px-3 py-2 shadow-sm"
            >
              <span className="rounded border border-brass px-1.5 py-0.5 font-mono text-xs text-brass">
                {rel.relationship_type}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink">
                {otherName(rel)}
              </span>
              {rel.notes && (
                <span className="hidden max-w-48 truncate text-xs text-slate sm:inline">
                  {rel.notes}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(rel)}
                disabled={isPending}
                aria-label={`Hapus relasi ${rel.relationship_type} dengan ${otherName(rel)}`}
                className="rounded p-1 text-slate/60 hover:bg-wine/10 hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
              >
                <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <RelationshipFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        projectId={projectId}
        character={character}
        allCharacters={allCharacters}
      />
    </section>
  );
}
