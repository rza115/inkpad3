import { notFound } from "next/navigation";
import { fetchExportData } from "@/lib/actions/export";
import { ReaderView } from "@/components/reader/ReaderView";

// Reader scope "seluruh project": semua chapter berurutan dalam satu halaman.
export default async function ReadProjectPage({
  params,
}: PageProps<"/[projectId]/read">) {
  const { projectId } = await params;
  const data = await fetchExportData(projectId, "full-project");

  if (!data) {
    notFound();
  }

  return <ReaderView projectId={projectId} data={data} scope="project" />;
}
