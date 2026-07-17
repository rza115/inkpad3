"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  deleteProject,
  renameProject,
  type Project,
  type ProjectActionState,
} from "@/lib/actions/projects";
import { useUIStore } from "@/store/useUIStore";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState: ProjectActionState = { error: null };

export function ProjectCardMenu({ project }: { project: Project }) {
  const openMenuId = useUIStore((s) => s.openProjectMenuId);
  const setOpenMenuId = useUIStore((s) => s.setOpenProjectMenuId);
  const renamingId = useUIStore((s) => s.renamingProjectId);
  const setRenamingId = useUIStore((s) => s.setRenamingProjectId);

  const menuOpen = openMenuId === project.id;
  const renaming = renamingId === project.id;
  const menuRef = useRef<HTMLDivElement>(null);

  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteProject,
    initialState
  );

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen, setOpenMenuId]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={`Menu project ${project.title}`}
        aria-expanded={menuOpen}
        onClick={() => setOpenMenuId(menuOpen ? null : project.id)}
        className="rounded px-2 py-1 text-slate hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-wine"
      >
        ⋯
      </button>

      {menuOpen && (
        <div className="absolute right-0 bottom-full z-10 mb-1 flex w-36 flex-col rounded border border-ink/10 bg-parchment py-1 shadow-md">
          <button
            type="button"
            onClick={() => {
              setOpenMenuId(null);
              setRenamingId(project.id);
            }}
            className="px-3 py-2 text-left text-sm text-ink hover:bg-ink/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-wine"
          >
            Ganti judul
          </button>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={project.id} />
            <button
              type="submit"
              disabled={deletePending}
              className="w-full px-3 py-2 text-left text-sm text-wine hover:bg-wine/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-wine disabled:opacity-50"
            >
              {deletePending ? "Menghapus..." : "Hapus"}
            </button>
          </form>
          {deleteState.error && (
            <p role="alert" className="px-3 py-1 text-xs text-wine">
              {deleteState.error}
            </p>
          )}
        </div>
      )}

      <Modal
        open={renaming}
        onClose={() => setRenamingId(null)}
        title="Ganti Judul"
      >
        {renaming && (
          <RenameForm project={project} onClose={() => setRenamingId(null)} />
        )}
      </Modal>
    </div>
  );
}

function RenameForm({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    renameProject,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state, onClose]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={project.id} />
      <Input
        label="Judul"
        name="title"
        defaultValue={project.title}
        autoFocus
        required
      />
      {state.error && (
        <p role="alert" className="text-sm text-wine">
          {state.error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
