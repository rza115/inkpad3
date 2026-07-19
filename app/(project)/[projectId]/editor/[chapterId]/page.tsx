import { notFound } from "next/navigation";
import { getChapter } from "@/lib/actions/chapters";
import { getScenes } from "@/lib/actions/scenes";
import { getVersions } from "@/lib/actions/versions";
import { getCharacters } from "@/lib/actions/characters";
import { getWorldbuildingEntries } from "@/lib/actions/worldbuilding";
import { getInlineNotes, type InlineNote } from "@/lib/actions/inlineNotes";
import { EditorCanvas } from "@/components/editor/EditorCanvas";

export default async function EditorPage({
  params,
}: PageProps<"/[projectId]/editor/[chapterId]">) {
  const { projectId, chapterId } = await params;

  const chapter = await getChapter(chapterId);
  if (!chapter || chapter.project_id !== projectId) {
    notFound();
  }

  const [scenes, versions, characters, worldbuilding] = await Promise.all([
    getScenes(chapterId),
    getVersions(chapterId),
    getCharacters(projectId),
    getWorldbuildingEntries(projectId),
  ]);

  // Inline notes (Fase 11) per scene — fetch paralel, kelompokkan jadi map
  // sceneId → notes biar EditorCanvas bisa lookup tanpa fetch ulang per marker.
  const notesPerScene = await Promise.all(
    scenes.map((s) => getInlineNotes(s.id))
  );
  const inlineNotesByScene: Record<string, InlineNote[]> = {};
  scenes.forEach((s, i) => {
    inlineNotesByScene[s.id] = notesPerScene[i];
  });

  return (
    <EditorCanvas
      projectId={projectId}
      chapter={chapter}
      scenes={scenes}
      versions={versions}
      characters={characters}
      worldbuilding={worldbuilding}
      inlineNotesByScene={inlineNotesByScene}
    />
  );
}
