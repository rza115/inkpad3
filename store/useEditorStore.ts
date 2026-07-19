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

// Fase 11: inline note yang lagi dibuka (klik marker / tap ikon inline).
// Dipisah dari activeEntityRef (bukan disatukan) — Fase 9 sudah jalan & beda
// perilaku (hover vs klik, popover read-only vs ada tombol Hapus). rect =
// posisi span [data-note-id] buat positioning popover desktop.
export type ActiveNoteRef = {
  noteId: string;
  sceneId: string; // scene tempat mark ini — buat strip mark saat Hapus
  content: string;
  quotedText: string; // kutipan teks asli, ditampilkan di popover/bottom sheet
  rect: DOMRect;
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
  // Fase 11: inline note yang lagi dibuka + setter (pola sama activeEntityRef).
  activeNoteRef: ActiveNoteRef;
  setActiveNoteRef: (ref: ActiveNoteRef) => void;
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
  activeNoteRef: null,
  setActiveNoteRef: (ref) => set({ activeNoteRef: ref }),
  resetEditorState: () =>
    set({
      sceneStatuses: {},
      retryCallbacks: {},
      wordCounts: {},
      entityIndex: [],
      activeEntityRef: null,
      activeNoteRef: null,
    }),
}));
