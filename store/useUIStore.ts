import { create } from "zustand";

// UI state saja — jangan pernah simpan salinan data Supabase di sini.
type UIState = {
  createProjectModalOpen: boolean;
  setCreateProjectModalOpen: (open: boolean) => void;
  // id project yang menunya lagi terbuka (dropdown rename/delete), null = tidak ada
  openProjectMenuId: string | null;
  setOpenProjectMenuId: (id: string | null) => void;
  // id project yang lagi di-rename lewat modal, null = tidak ada
  renamingProjectId: string | null;
  setRenamingProjectId: (id: string | null) => void;
};

export const useUIStore = create<UIState>((set) => ({
  createProjectModalOpen: false,
  setCreateProjectModalOpen: (open) => set({ createProjectModalOpen: open }),
  openProjectMenuId: null,
  setOpenProjectMenuId: (id) => set({ openProjectMenuId: id }),
  renamingProjectId: null,
  setRenamingProjectId: (id) => set({ renamingProjectId: id }),
}));
