'use client';

import { useState } from 'react';
import { exportProject, type ExportScope, type ExportFormat } from '@/lib/actions/export';
import { Button } from '@/components/ui/Button';

interface ExportPanelProps {
  projectId: string;
  chapters: { id: string; title: string; order: number }[];
}

export default function ExportPanel({ projectId, chapters }: ExportPanelProps) {
  const [scope, setScope] = useState<ExportScope>('full-project');
  const [format, setFormat] = useState<ExportFormat>('docx');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      const result = await exportProject(
        projectId,
        scope,
        format,
        scope === 'chapter' ? selectedChapterId : undefined
      );

      if (!result.success) {
        setError(result.error || 'Export failed');
        setExporting(false);
        return;
      }

      // Trigger download
      if (result.data && result.filename) {
        let blob: Blob;
        
        if (format === 'markdown') {
          // Markdown adalah plain text
          blob = new Blob([result.data], { type: 'text/markdown' });
        } else {
          // DOCX atau PDF datang sebagai base64 string, decode ke binary
          const binaryString = atob(result.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const mimeType = format === 'pdf' 
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          blob = new Blob([bytes], { type: mimeType });
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
      setError('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-slate/30 bg-parchment p-6">
      <h2 className="font-fraunces text-lg font-semibold text-ink">Export Settings</h2>

      {/* Scope selector */}
      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-ink">Export Scope</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="scope"
              value="full-project"
              checked={scope === 'full-project'}
              onChange={(e) => setScope(e.target.value as ExportScope)}
              className="h-4 w-4 accent-wine"
            />
            <span className="text-sm text-ink">Full Project</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="scope"
              value="chapter"
              checked={scope === 'chapter'}
              onChange={(e) => setScope(e.target.value as ExportScope)}
              className="h-4 w-4 accent-wine"
            />
            <span className="text-sm text-ink">Single Chapter</span>
          </label>
        </div>
      </div>

      {/* Chapter selector (kalau scope = chapter) */}
      {scope === 'chapter' && (
        <div className="mt-4">
          <label htmlFor="chapter-select" className="mb-2 block text-sm font-medium text-ink">
            Select Chapter
          </label>
          <select
            id="chapter-select"
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            className="w-full rounded border border-slate/30 bg-parchment px-3 py-2 text-sm text-ink focus:border-wine focus:outline-none focus:ring-1 focus:ring-wine"
          >
            <option value="">-- Choose a chapter --</option>
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Format selector */}
      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-ink">Export Format</label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="format"
              value="docx"
              checked={format === 'docx'}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="h-4 w-4 accent-wine"
            />
            <span className="text-sm text-ink">DOCX (Microsoft Word)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="format"
              value="pdf"
              checked={format === 'pdf'}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="h-4 w-4 accent-wine"
            />
            <span className="text-sm text-ink">PDF</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="format"
              value="markdown"
              checked={format === 'markdown'}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="h-4 w-4 accent-wine"
            />
            <span className="text-sm text-ink">Markdown</span>
          </label>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 rounded border border-wine/30 bg-wine/10 p-3 text-sm text-wine">
          {error}
        </div>
      )}

      {/* Export button */}
      <div className="mt-6">
        <Button
          onClick={handleExport}
          disabled={exporting || (scope === 'chapter' && !selectedChapterId)}
          className="w-full"
        >
          {exporting ? 'Exporting…' : 'Export & Download'}
        </Button>
      </div>
    </div>
  );
}
