'use server';

import { createClient } from '@/lib/supabase/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { Document as PDFDocument, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export type ExportScope = 'chapter' | 'full-project';
export type ExportFormat = 'docx' | 'pdf' | 'markdown';

export interface ExportChapterData {
  id: string;
  title: string;
  order: number;
  scenes: {
    id: string;
    content: string;
    order: number;
  }[];
}

export interface ExportProjectData {
  title: string;
  chapters: ExportChapterData[];
}

/**
 * Fetch data untuk export dari Supabase (fresh data saat export di-trigger)
 */
export async function fetchExportData(
  projectId: string,
  scope: ExportScope,
  chapterId?: string
): Promise<ExportProjectData | null> {
  const supabase = await createClient();

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('title')
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (projectError || !project) {
    console.error('Error fetching project:', projectError);
    return null;
  }

  // Fetch chapters (filter by chapterId kalau scope = chapter)
  const chaptersQuery = supabase
    .from('chapters')
    .select('id, title, order')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('order', { ascending: true });

  if (scope === 'chapter' && chapterId) {
    chaptersQuery.eq('id', chapterId);
  }

  const { data: chapters, error: chaptersError } = await chaptersQuery;

  if (chaptersError || !chapters) {
    console.error('Error fetching chapters:', chaptersError);
    return null;
  }

  // Fetch scenes untuk semua chapter
  const chapterIds = chapters.map((c) => c.id);
  const { data: scenes, error: scenesError } = await supabase
    .from('scenes')
    .select('id, chapter_id, content, order')
    .in('chapter_id', chapterIds)
    .is('deleted_at', null)
    .order('order', { ascending: true });

  if (scenesError) {
    console.error('Error fetching scenes:', scenesError);
    return null;
  }

  // Group scenes by chapter
  const chaptersWithScenes: ExportChapterData[] = chapters.map((chapter) => ({
    ...chapter,
    scenes: (scenes || []).filter((s) => s.chapter_id === chapter.id),
  }));

  return {
    title: project.title,
    chapters: chaptersWithScenes,
  };
}

/**
 * Generate DOCX dari data project
 */
export async function generateDocx(data: ExportProjectData): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: data.title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 },
    })
  );

  // Chapters & scenes
  for (const chapter of data.chapters) {
    // Chapter title
    children.push(
      new Paragraph({
        text: chapter.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    // Scenes content (continuous)
    for (const scene of chapter.scenes) {
      // Strip HTML tags sederhana (TipTap output)
      const plainText = scene.content
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();

      if (plainText) {
        children.push(
          new Paragraph({
            children: [new TextRun(plainText)],
            spacing: { after: 200 },
          })
        );
      } else {
        // Fallback: scene kosong
        children.push(
          new Paragraph({
            children: [new TextRun({ text: '[Scene kosong]', italics: true })],
            spacing: { after: 200 },
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

/**
 * Generate PDF dari data project menggunakan @react-pdf/renderer
 */
export async function generatePdf(data: ExportProjectData): Promise<Buffer> {
  const React = await import('react');
  const { pdf } = await import('@react-pdf/renderer');

  // PDF styles
  const styles = StyleSheet.create({
    page: {
      paddingTop: 60,
      paddingBottom: 60,
      paddingHorizontal: 60,
      fontFamily: 'Helvetica',
      fontSize: 12,
      lineHeight: 1.6,
    },
    title: {
      fontFamily: 'Times-Roman',
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 30,
      textAlign: 'center',
    },
    chapterTitle: {
      fontFamily: 'Times-Roman',
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 24,
      marginBottom: 12,
    },
    scene: {
      marginBottom: 12,
      textAlign: 'justify',
    },
    emptyScene: {
      marginBottom: 12,
      fontStyle: 'italic',
      color: '#666666',
    },
  });

  // Build document using createElement to avoid JSX
  const sceneElements = (chapter: ExportChapterData) => {
    return chapter.scenes.map((scene) => {
      const plainText = scene.content
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();

      if (plainText) {
        return React.createElement(
          Text,
          { key: scene.id, style: styles.scene },
          plainText
        );
      } else {
        return React.createElement(
          Text,
          { key: scene.id, style: styles.emptyScene },
          '[Scene kosong]'
        );
      }
    });
  };

  const chapterElements = data.chapters.map((chapter) => {
    return React.createElement(
      View,
      { key: chapter.id },
      React.createElement(Text, { style: styles.chapterTitle }, chapter.title),
      ...sceneElements(chapter)
    );
  });

  const documentElement = React.createElement(
    PDFDocument,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(View, null, React.createElement(Text, { style: styles.title }, data.title)),
      ...chapterElements
    )
  );

  // Generate PDF and convert to buffer
  const pdfBlob = await pdf(documentElement).toBlob();
  const arrayBuffer = await pdfBlob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate Markdown dari data project
 */
export async function generateMarkdown(data: ExportProjectData): Promise<string> {
  let markdown = `# ${data.title}\n\n`;

  for (const chapter of data.chapters) {
    markdown += `## ${chapter.title}\n\n`;

    for (const scene of chapter.scenes) {
      // Strip HTML tags
      const plainText = scene.content
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();

      if (plainText) {
        markdown += `${plainText}\n\n`;
      }
    }
  }

  return markdown;
}

/**
 * Export chapter atau full project (orchestration)
 * Binary data (DOCX/PDF) dikembalikan sebagai base64 string untuk serialization Next.js
 */
export async function exportProject(
  projectId: string,
  scope: ExportScope,
  format: ExportFormat,
  chapterId?: string
): Promise<{ success: boolean; filename?: string; data?: string; error?: string }> {
  try {
    // Fetch fresh data dari Supabase
    const data = await fetchExportData(projectId, scope, chapterId);

    if (!data) {
      return { success: false, error: 'Failed to fetch project data' };
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const scopeLabel = scope === 'chapter' ? 'chapter' : 'project';

    if (format === 'docx') {
      const buffer = await generateDocx(data);
      // Convert buffer to base64 untuk serialization
      return {
        success: true,
        filename: `${data.title}-${scopeLabel}-${timestamp}.docx`,
        data: buffer.toString('base64'),
      };
    }

    if (format === 'markdown') {
      const markdown = await generateMarkdown(data);
      return {
        success: true,
        filename: `${data.title}-${scopeLabel}-${timestamp}.md`,
        data: markdown,
      };
    }

    if (format === 'pdf') {
      const buffer = await generatePdf(data);
      // Convert buffer to base64 untuk serialization
      return {
        success: true,
        filename: `${data.title}-${scopeLabel}-${timestamp}.pdf`,
        data: buffer.toString('base64'),
      };
    }

    return { success: false, error: 'Invalid export format' };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: 'Export failed' };
  }
}
