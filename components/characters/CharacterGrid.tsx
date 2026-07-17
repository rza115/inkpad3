"use client";

import { useState } from "react";
import type { Character } from "@/lib/actions/characters";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CharacterCard } from "./CharacterCard";
import { CharacterForm } from "./CharacterForm";

type CharacterGridProps = {
  projectId: string;
  characters: Character[];
};

export function CharacterGrid({ projectId, characters }: CharacterGridProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreateOpen(true)}>
          + Karakter baru
        </Button>
      </div>

      {characters.length === 0 ? (
        <p className="rounded border border-slate/30 border-dashed px-4 py-8 text-center text-sm text-slate">
          Belum ada karakter — tambahkan yang pertama.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              projectId={projectId}
              character={character}
            />
          ))}
        </ul>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Karakter baru"
      >
        <CharacterForm
          projectId={projectId}
          onDone={() => setCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
