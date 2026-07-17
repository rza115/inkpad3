import { create } from "zustand";

// Status save per scene + word count — UI state turunan, BUKAN copy konten
// Supabase. Draft konten hidup di TipTap selama halaman terbuka (aturan
// anti-ambiguitas #2); begitu save sukses, source of truth balik ke Supabase.
export type SaveStatus = "saved" | "saving" | "failed";

type EditorState = {
  sceneStatuses: Record<string, SaveStatus>;
  setSceneStatus: (sceneId: string, status: SaveStatus) => void;
  // retry callback per scene yang failed — dipanggil SaveStatusIndicator
  retryCallbacks: Record<string, () => void>;
  registerRetry: (sceneId: string, retry: () => void) => void;
  wordCounts: Record<string, number>;
  setWordCount: (sceneId: string, count: number) => void;
  // dipanggil pas unmount halaman editor, biar state gak bocor antar chapter
  resetEditorState: () => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  sceneStatuses: {},
  setSceneStatus: (sceneId, status) =>
    set((s) => ({ sceneStatuses: { ...s.sceneStatuses, [sceneId]: status } })),
  retryCallbacks: {},
  registerRetry: (sceneId, retry) =>
    set((s) => ({ retryCallbacks: { ...s.retryCallbacks, [sceneId]: retry } })),
  wordCounts: {},
  setWordCount: (sceneId, count) =>
    set((s) => ({ wordCounts: { ...s.wordCounts, [sceneId]: count } })),
  resetEditorState: () =>
    set({ sceneStatuses: {}, retryCallbacks: {}, wordCounts: {} }),
}));
