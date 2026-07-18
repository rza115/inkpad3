'use server';

import { createClient } from '@/lib/supabase/server';

export type SearchResultType = 'chapter' | 'scene' | 'note' | 'character' | 'plot' | 'worldbuilding';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  excerpt: string;
  targetUrl: string; // URL untuk navigate saat diklik
  chapterId?: string; // untuk scene, perlu chapter parent
}

export interface SearchResultGroup {
  type: SearchResultType;
  label: string;
  results: SearchResult[];
  totalCount: number; // total hasil sebelum limit
}

interface SceneWithChapter {
  id: string;
  content: string;
  chapter_id: string;
  chapters: {
    id: string;
    title: string;
  };
}

/**
 * Search across all modules dalam satu project
 * Query paralel ke 6 tabel, return hasil grouped per tipe
 */
export async function searchProject(
  projectId: string,
  query: string
): Promise<{ success: boolean; groups: SearchResultGroup[]; error?: string }> {
  if (!query.trim()) {
    return { success: true, groups: [] };
  }

  const supabase = await createClient();
  const searchPattern = `%${query.trim()}%`;
  const LIMIT_PER_TYPE = 5;

  try {
    // Query paralel ke semua tabel
    const [
      chaptersRes,
      scenesRes,
      notesRes,
      charactersRes,
      plotRes,
      worldbuildingRes,
    ] = await Promise.all([
      // Chapters (search title)
      supabase
        .from('chapters')
        .select('id, title')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .ilike('title', searchPattern)
        .order('order', { ascending: true }),

      // Scenes (search content) — perlu chapter_id untuk navigate
      supabase
        .from('scenes')
        .select('id, content, chapter_id, chapters!inner(id, title)')
        .eq('chapters.project_id', projectId)
        .is('deleted_at', null)
        .is('chapters.deleted_at', null)
        .ilike('content', searchPattern)
        .order('order', { ascending: true }),

      // Notes (search title + content)
      supabase
        .from('notes')
        .select('id, title, content')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
        .order('created_at', { ascending: false }),

      // Characters (search name + description)
      supabase
        .from('characters')
        .select('id, name, description')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .order('name', { ascending: true }),

      // Plot Points (search title + description)
      supabase
        .from('plot_points')
        .select('id, title, description')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .order('order', { ascending: true }),

      // Worldbuilding Entries (search title + content)
      supabase
        .from('worldbuilding_entries')
        .select('id, title, content, category')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
        .order('category', { ascending: true }),
    ]);

    // Helper: excerpt dari HTML/text
    function makeExcerpt(text: string, maxLen = 80): string {
      const plain = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!plain) return '(kosong)';
      return plain.length > maxLen ? `${plain.slice(0, maxLen)}…` : plain;
    }

    const groups: SearchResultGroup[] = [];

    // Chapters
    if (chaptersRes.data && chaptersRes.data.length > 0) {
      const total = chaptersRes.data.length;
      groups.push({
        type: 'chapter',
        label: 'Chapters',
        totalCount: total,
        results: chaptersRes.data.slice(0, LIMIT_PER_TYPE).map((c) => ({
          id: c.id,
          type: 'chapter',
          title: c.title,
          excerpt: '',
          targetUrl: `/${projectId}/editor/${c.id}`,
        })),
      });
    }

    // Scenes
    if (scenesRes.data && scenesRes.data.length > 0) {
      const total = scenesRes.data.length;
      const scenesData = scenesRes.data as unknown as SceneWithChapter[];
      groups.push({
        type: 'scene',
        label: 'Scenes',
        totalCount: total,
        results: scenesData.slice(0, LIMIT_PER_TYPE).map((s) => ({
          id: s.id,
          type: 'scene',
          title: `Scene di "${s.chapters.title}"`,
          excerpt: makeExcerpt(s.content),
          targetUrl: `/${projectId}/editor/${s.chapter_id}`,
          chapterId: s.chapter_id,
        })),
      });
    }

    // Notes
    if (notesRes.data && notesRes.data.length > 0) {
      const total = notesRes.data.length;
      groups.push({
        type: 'note',
        label: 'Notes',
        totalCount: total,
        results: notesRes.data.slice(0, LIMIT_PER_TYPE).map((n) => ({
          id: n.id,
          type: 'note',
          title: n.title,
          excerpt: makeExcerpt(n.content),
          targetUrl: `/${projectId}/notes`,
        })),
      });
    }

    // Characters
    if (charactersRes.data && charactersRes.data.length > 0) {
      const total = charactersRes.data.length;
      groups.push({
        type: 'character',
        label: 'Characters',
        totalCount: total,
        results: charactersRes.data.slice(0, LIMIT_PER_TYPE).map((ch) => ({
          id: ch.id,
          type: 'character',
          title: ch.name,
          excerpt: makeExcerpt(ch.description),
          targetUrl: `/${projectId}/characters/${ch.id}`,
        })),
      });
    }

    // Plot Points
    if (plotRes.data && plotRes.data.length > 0) {
      const total = plotRes.data.length;
      groups.push({
        type: 'plot',
        label: 'Plot Points',
        totalCount: total,
        results: plotRes.data.slice(0, LIMIT_PER_TYPE).map((p) => ({
          id: p.id,
          type: 'plot',
          title: p.title,
          excerpt: makeExcerpt(p.description),
          targetUrl: `/${projectId}/plot`,
        })),
      });
    }

    // Worldbuilding Entries
    if (worldbuildingRes.data && worldbuildingRes.data.length > 0) {
      const total = worldbuildingRes.data.length;
      groups.push({
        type: 'worldbuilding',
        label: 'Worldbuilding',
        totalCount: total,
        results: worldbuildingRes.data.slice(0, LIMIT_PER_TYPE).map((w) => ({
          id: w.id,
          type: 'worldbuilding',
          title: w.title,
          excerpt: `${w.category} — ${makeExcerpt(w.content, 60)}`,
          targetUrl: `/${projectId}/worldbuilding`,
        })),
      });
    }

    return { success: true, groups };
  } catch (error) {
    console.error('Search error:', error);
    return { success: false, groups: [], error: 'Search failed' };
  }
}
