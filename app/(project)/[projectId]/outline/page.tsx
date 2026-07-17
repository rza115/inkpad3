import { getChapters } from "@/lib/actions/chapters";
import { getScenes, type Scene } from "@/lib/actions/scenes";
import { ChapterList } from "@/components/outline/ChapterList";

export default async function OutlinePage({
  params,
}: PageProps<"/[projectId]/outline">) {
  const { projectId } = await params;
  const chapters = await getChapters(projectId);

  const scenesByChapter: Record<string, Scene[]> = Object.fromEntries(
    await Promise.all(
      chapters.map(async (c) => [c.id, await getScenes(c.id)] as const)
    )
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
      <h2 className="font-display text-2xl font-semibold text-ink">Outline</h2>
      <ChapterList
        projectId={projectId}
        chapters={chapters}
        scenesByChapter={scenesByChapter}
      />
    </div>
  );
}
