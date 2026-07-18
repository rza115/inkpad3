'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { importFile } from '@/lib/actions/import';
import { Button } from '@/components/ui/Button';

interface ImportDropzoneProps {
  projectId: string;
}

export default function ImportDropzone({ projectId }: ImportDropzoneProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    chapterId?: string;
    chapterTitle?: string;
    scenesCount?: number;
    error?: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'docx' || ext === 'md' || ext === 'markdown') {
        setFile(selectedFile);
        setResult(null);
      } else {
        setResult({ success: false, error: 'Only .docx and .md files are supported' });
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const importResult = await importFile(projectId, file.name, buffer);

      setResult(importResult);

      if (importResult.success && importResult.chapterId) {
        // Redirect ke editor chapter baru setelah 2 detik
        setTimeout(() => {
          router.push(`/${projectId}/editor/${importResult.chapterId}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Import error:', error);
      setResult({ success: false, error: 'Import failed' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-lg border border-slate/30 bg-parchment p-6">
        <h2 className="font-fraunces text-lg font-semibold text-ink">Import File</h2>
        <p className="mt-2 text-sm text-slate">
          Upload a .docx or .md file to import as a new chapter. Text will be split into scenes
          automatically.
        </p>

        <div className="mt-6">
          <input
            type="file"
            accept=".docx,.md,.markdown"
            onChange={handleFileChange}
            className="w-full text-sm text-ink file:mr-4 file:rounded file:border-0 file:bg-wine file:px-4 file:py-2 file:text-sm file:font-medium file:text-parchment hover:file:bg-wine/90"
          />
        </div>

        {file && (
          <div className="mt-4 rounded border border-slate/30 bg-parchment/50 p-3">
            <p className="text-sm text-ink">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
            <p className="text-xs text-slate">
              Size: {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {result && (
          <div
            className={`mt-4 rounded border p-3 text-sm ${
              result.success
                ? 'border-brass/30 bg-brass/10 text-brass'
                : 'border-wine/30 bg-wine/10 text-wine'
            }`}
          >
            {result.success ? (
              <>
                <p className="font-medium">Import successful!</p>
                <p className="mt-1">
                  Created chapter: {result.chapterTitle} ({result.scenesCount} scenes)
                </p>
                <p className="mt-1 text-xs">Redirecting to editor...</p>
              </>
            ) : (
              <p>{result.error}</p>
            )}
          </div>
        )}

        <div className="mt-6">
          <Button onClick={handleImport} disabled={!file || importing} className="w-full">
            {importing ? 'Importing…' : 'Import File'}
          </Button>
        </div>
      </div>
    </div>
  );
}
