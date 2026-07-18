'use server';

import { createClient } from '@/lib/supabase/server';
import mammoth from 'mammoth';

interface ImportResult {
  success: boolean;
  chapterId?: string;
  chapterTitle?: string;
  scenesCount?: number;
  error?: string;
}

/**
 * Parse DOCX file jadi plain text
 */
async function parseDocx(buffer: ArrayBuffer): Promise<string | null> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    return null;
  }
}

/**
 * Parse Markdown file jadi plain text (sudah plain text, cuma strip frontmatter kalau ada)
 */
function parseMarkdown(text: string): string {
  // Strip YAML frontmatter kalau ada (--- ... ---)
  return text.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
}

/**
 * Split text jadi scenes berdasarkan paragraph breaks (2+ newlines)
 * Tiap "chunk" text yang dipisah 2+ baris kosong = 1 scene
 */
function splitIntoScenes(text: string): string[] {
  const scenes = text
    .split(/\n\n+/) // Split by 2+ newlines
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Kalau cuma 1 chunk besar, anggap itu 1 scene aja
  return scenes.length > 0 ? scenes : [text];
}

/**
 * Import DOCX/Markdown jadi chapter baru (minimal: 1 file → 1 chapter → N scenes)
 */
export async function importFile(
  projectId: string,
  fileName: string,
  fileBuffer: ArrayBuffer
): Promise<ImportResult> {
  try {
    const supabase = await createClient();

    // Parse file berdasarkan extension
    let text: string | null = null;
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (ext === 'docx') {
      text = await parseDocx(fileBuffer);
    } else if (ext === 'md' || ext === 'markdown') {
      const decoder = new TextDecoder('utf-8');
      const rawText = decoder.decode(fileBuffer);
      text = parseMarkdown(rawText);
    } else {
      return { success: false, error: 'Unsupported file format. Only .docx and .md are allowed.' };
    }

    if (!text || text.trim().length === 0) {
      return { success: false, error: 'Failed to extract text from file or file is empty.' };
    }

    // Generate chapter title dari filename (strip extension)
    const chapterTitle = fileName.replace(/\.(docx|md|markdown)$/i, '');

    // Get max order untuk chapter baru
    const { data: existingChapters } = await supabase
      .from('chapters')
      .select('order')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('order', { ascending: false })
      .limit(1);

    const maxOrder = existingChapters?.[0]?.order ?? -1;
    const newOrder = maxOrder + 1;

    // Insert chapter baru
    const { data: newChapter, error: chapterError } = await supabase
      .from('chapters')
      .insert({
        project_id: projectId,
        title: chapterTitle,
        order: newOrder,
        status: 'draft',
      })
      .select('id, title')
      .single();

    if (chapterError || !newChapter) {
      console.error('Error creating chapter:', chapterError);
      return { success: false, error: 'Failed to create chapter' };
    }

    // Split text jadi scenes
    const sceneTexts = splitIntoScenes(text);

    // Insert scenes
    const scenesData = sceneTexts.map((content, index) => ({
      chapter_id: newChapter.id,
      content,
      order: index,
    }));

    const { error: scenesError } = await supabase.from('scenes').insert(scenesData);

    if (scenesError) {
      console.error('Error creating scenes:', scenesError);
      // Rollback chapter (soft-delete)
      await supabase
        .from('chapters')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', newChapter.id);

      return { success: false, error: 'Failed to create scenes' };
    }

    return {
      success: true,
      chapterId: newChapter.id,
      chapterTitle: newChapter.title,
      scenesCount: sceneTexts.length,
    };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, error: 'Import failed' };
  }
}
