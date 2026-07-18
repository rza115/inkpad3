import ImportDropzone from '@/components/import/ImportDropzone';

export default async function ImportPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <div className="p-6">
      <h1 className="font-fraunces text-2xl font-semibold text-ink">Import</h1>
      <p className="mt-2 text-sm text-slate">
        Import manuscript files (.docx or .md) as new chapters.
      </p>

      <div className="mt-8">
        <ImportDropzone projectId={projectId} />
      </div>
    </div>
  );
}
