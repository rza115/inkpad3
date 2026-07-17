import { getPlotPoints } from "@/lib/actions/plot";
import { getChapters } from "@/lib/actions/chapters";
import { PlotPointList } from "@/components/plot/PlotPointList";

export default async function PlotPage({
  params,
}: PageProps<"/[projectId]/plot">) {
  const { projectId } = await params;
  const [plotPoints, chapters] = await Promise.all([
    getPlotPoints(projectId),
    getChapters(projectId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
      <h2 className="font-display text-2xl font-semibold text-ink">Plot</h2>
      <PlotPointList
        projectId={projectId}
        plotPoints={plotPoints}
        chapters={chapters}
      />
    </div>
  );
}
