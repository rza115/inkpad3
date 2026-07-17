import { getDeletedItems } from "@/lib/actions/trash";
import { TrashList } from "@/components/trash/TrashList";

export default async function TrashPage({
  params,
}: PageProps<"/[projectId]/trash">) {
  const { projectId } = await params;
  const items = await getDeletedItems(projectId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
      <h2 className="font-display text-2xl font-semibold text-ink">Trash</h2>
      <p className="text-sm text-slate">
        Entitas yang dihapus dari modul manapun. Restore untuk mengembalikan,
        atau hapus permanen (tidak bisa dibatalkan).
      </p>
      <TrashList projectId={projectId} items={items} />
    </div>
  );
}
