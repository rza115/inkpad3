import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ExportPanel from '@/components/export/ExportPanel';

export default async function ExportPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();

  // Fetch chapters untuk dropdown selector
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, title, order')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('order', { ascending: true });

  if (!chapters) {
    redirect(`/${projectId}/outline`);
  }

  return (
    <div className="p-6">
      <h1 className="font-fraunces text-2xl font-semibold text-ink">Export</h1>
      <p className="mt-2 text-sm text-slate">
        Download chapter atau seluruh project dalam format DOCX atau Markdown.
      </p>

      <div className="mt-8">
        <ExportPanel projectId={projectId} chapters={chapters} />
      </div>
    </div>
  );
}
