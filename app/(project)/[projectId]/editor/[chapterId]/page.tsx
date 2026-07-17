import { notFound } from "next/navigation";
import { getChapter } from "@/lib/actions/chapters";
import { getScenes } from "@/lib/actions/scenes";
import { getVersions } from "@/lib/actions/versions";
import { EditorCanvas } from "@/components/editor/EditorCanvas";

export default async function EditorPage({
  params,
}: PageProps<"/[projectId]/editor/[chapterId]">) {
  const { projectId, chapterId } = await params;

  const chapter = await getChapter(chapterId);
  if (!chapter || chapter.project_id !== projectId) {
    notFound();
  }

  const [scenes, versions] = await Promise.all([
    getScenes(chapterId),
    getVersions(chapterId),
  ]);

  return (
    <EditorCanvas
      projectId={projectId}
      chapter={chapter}
      scenes={scenes}
      versions={versions}
    />
  );
}
