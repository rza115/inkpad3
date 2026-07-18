import { getIllustrations } from "@/lib/actions/illustrations";
import { IllustrationGallery } from "@/components/illustration/IllustrationGallery";

export default async function IllustrationPage({
  params,
}: PageProps<"/[projectId]/illustration">) {
  const { projectId } = await params;
  const illustrations = await getIllustrations(projectId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
      <h2 className="font-display text-2xl font-semibold text-ink">
        Illustrations
      </h2>
      <IllustrationGallery projectId={projectId} illustrations={illustrations} />
    </div>
  );
}
