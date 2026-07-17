import { getWorldbuildingEntries } from "@/lib/actions/worldbuilding";
import { WorldbuildingList } from "@/components/worldbuilding/WorldbuildingList";

export default async function WorldbuildingPage({
  params,
}: PageProps<"/[projectId]/worldbuilding">) {
  const { projectId } = await params;
  const entries = await getWorldbuildingEntries(projectId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
      <h2 className="font-display text-2xl font-semibold text-ink">
        Worldbuilding
      </h2>
      <WorldbuildingList projectId={projectId} entries={entries} />
    </div>
  );
}
