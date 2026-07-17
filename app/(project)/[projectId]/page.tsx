import { redirect } from "next/navigation";

// /{projectId} tidak punya halaman sendiri — langsung ke Outline
// (disetujui user: file kecil di luar breakdown, cuma redirect).
export default async function ProjectIndexPage({
  params,
}: PageProps<"/[projectId]">) {
  const { projectId } = await params;
  redirect(`/${projectId}/outline`);
}
