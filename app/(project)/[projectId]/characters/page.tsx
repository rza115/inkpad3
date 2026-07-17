import { getCharacters } from "@/lib/actions/characters";
import { CharacterGrid } from "@/components/characters/CharacterGrid";

export default async function CharactersPage({
  params,
}: PageProps<"/[projectId]/characters">) {
  const { projectId } = await params;
  const characters = await getCharacters(projectId);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
      <h2 className="font-display text-2xl font-semibold text-ink">
        Characters
      </h2>
      <CharacterGrid projectId={projectId} characters={characters} />
    </div>
  );
}
