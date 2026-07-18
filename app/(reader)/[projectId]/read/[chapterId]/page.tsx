import { notFound, redirect } from "next/navigation";
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

  // Project tidak ada → 404. Chapter tidak ada (mis. link resume basi setelah
  // chapter dihapus) → fallback scope project; landing di sana menulis ulang
  // lastRead di store, link sidebar sembuh permanen.
  if (!data) {
    notFound();
  }
  if (data.chapters.length === 0) {
    redirect(`/${projectId}/read`);
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
