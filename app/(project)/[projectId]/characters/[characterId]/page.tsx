import { notFound } from "next/navigation";
import { getCharacter, getCharacters } from "@/lib/actions/characters";
import { getRelationships } from "@/lib/actions/relationships";
import { CharacterForm } from "@/components/characters/CharacterForm";
import { RelationshipList } from "@/components/characters/RelationshipList";

export default async function CharacterDetailPage({
  params,
}: PageProps<"/[projectId]/characters/[characterId]">) {
  const { projectId, characterId } = await params;

  const character = await getCharacter(characterId);
  if (!character || character.project_id !== projectId) {
    notFound();
  }

  const [relationships, allCharacters] = await Promise.all([
    getRelationships(characterId),
    getCharacters(projectId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
      <h2 className="font-display text-2xl font-semibold text-ink">
        {character.name}
      </h2>

      <CharacterForm projectId={projectId} character={character} />

      <RelationshipList
        projectId={projectId}
        character={character}
        relationships={relationships}
        allCharacters={allCharacters}
      />
    </div>
  );
}
