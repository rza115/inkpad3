import { notFound } from "next/navigation";
import { fetchExportData } from "@/lib/actions/export";
import { getChapters } from "@/lib/actions/chapters";
import { ReaderView } from "@/components/reader/ReaderView";

// Reader scope "per chapter": satu chapter + nav prev/next dari daftar chapter.
export default async function ReadChapterPage({
  params,
}: PageProps<"/[projectId]/read/[chapterId]">) {
  const { projectId, chapterId } = await params;
  const [data, chapters] = await Promise.all([
    fetchExportData(projectId, "chapter", chapterId),
    getChapters(projectId),
  ]);

  if (!data || data.chapters.length === 0) {
    notFound();
  }

  return (
    <ReaderView
      projectId={projectId}
      data={data}
      scope="chapter"
      chapters={chapters}
      currentChapterId={chapterId}
    />
  );
}
