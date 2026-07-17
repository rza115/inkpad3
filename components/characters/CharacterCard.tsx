"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { Character, CharacterRole } from "@/lib/actions/characters";
import { deleteCharacter } from "@/lib/actions/characters";

const ROLE_LABELS: Record<CharacterRole, string> = {
  protagonist: "Protagonist",
  antagonist: "Antagonist",
  side: "Side",
};

const ROLE_CLASSES: Record<CharacterRole, string> = {
  protagonist: "border-wine text-wine",
  antagonist: "border-ink/60 text-ink",
  side: "border-slate/40 text-slate",
};

type CharacterCardProps = {
  projectId: string;
  character: Character;
};

export function CharacterCard({ projectId, character }: CharacterCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Hapus karakter "${character.name}"? (bisa dikembalikan dari Trash)`))
      return;
    startTransition(() => {
      void deleteCharacter(character.id, projectId);
    });
  }

  return (
    <li className="group relative flex min-h-32 flex-col justify-between rounded-lg border border-ink/10 bg-parchment p-4 shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={`/${projectId}/characters/${character.id}`}
        className="flex flex-1 flex-col gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
      >
        <h3 className="font-display text-lg font-semibold text-ink group-hover:text-wine">
          {character.name}
        </h3>
        {character.description && (
          <p className="line-clamp-2 text-sm text-ink/70">
            {character.description}
          </p>
        )}
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <span
          className={`rounded border px-1.5 py-0.5 font-mono text-xs ${ROLE_CLASSES[character.role]}`}
        >
          {ROLE_LABELS[character.role]}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-label={`Hapus karakter ${character.name}`}
          className="rounded p-1 text-slate/60 hover:bg-wine/10 hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
        >
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" />
          </svg>
        </button>
      </div>
    </li>
  );
}
