import { getNotes } from "@/lib/actions/notes";
import { getChapters } from "@/lib/actions/chapters";
import { NoteList } from "@/components/notes/NoteList";

export default async function NotesPage({
  params,
}: PageProps<"/[projectId]/notes">) {
  const { projectId } = await params;
  const [notes, chapters] = await Promise.all([
    getNotes(projectId),
    getChapters(projectId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
      <h2 className="font-display text-2xl font-semibold text-ink">Notes</h2>
      <NoteList projectId={projectId} notes={notes} chapters={chapters} />
    </div>
  );
}
