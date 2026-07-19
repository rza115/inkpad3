import { create } from "zustand";
import type { EntityRef } from "@/lib/editor/entityIndex";

// Status save per scene + word count — UI state turunan, BUKAN copy konten
// Supabase. Draft konten hidup di TipTap selama halaman terbuka (aturan
// anti-ambiguitas #2); begitu save sukses, source of truth balik ke Supabase.
export type SaveStatus = "saved" | "saving" | "failed";

// Popover entity reference yang lagi aktif (hover/tap span .ref di editor).
export type ActiveEntityRef = {
  entityId: string;
  entityType: "character" | "worldbuilding";
  rect: DOMRect; // posisi span yang di-hover/tap, buat positioning popover
} | null;

type EditorState = {
  sceneStatuses: Record<string, SaveStatus>;
  setSceneStatus: (sceneId: string, status: SaveStatus) => void;
  // retry callback per scene yang failed — dipanggil SaveStatusIndicator
  retryCallbacks: Record<string, () => void>;
  registerRetry: (sceneId: string, retry: () => void) => void;
  wordCounts: Record<string, number>;
  setWordCount: (sceneId: string, count: number) => void;
  // Fase 9: index entity (di-set EditorCanvas dari props) + popover aktif.
  // entityIndex = data turunan fetch server component, bukan source of truth.
  entityIndex: EntityRef[];
  setEntityIndex: (index: EntityRef[]) => void;
  activeEntityRef: ActiveEntityRef;
  setActiveEntityRef: (ref: ActiveEntityRef) => void;
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
  entityIndex: [],
  setEntityIndex: (index) => set({ entityIndex: index }),
  activeEntityRef: null,
  setActiveEntityRef: (ref) => set({ activeEntityRef: ref }),
  resetEditorState: () =>
    set({
      sceneStatuses: {},
      retryCallbacks: {},
      wordCounts: {},
      entityIndex: [],
      activeEntityRef: null,
    }),
}));
