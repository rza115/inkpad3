"use client";

import { useActionState, useEffect } from "react";
import {
  createProject,
  type ProjectActionState,
} from "@/lib/actions/projects";
import { useUIStore } from "@/store/useUIStore";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState: ProjectActionState = { error: null };

export function CreateProjectModal() {
  const open = useUIStore((s) => s.createProjectModalOpen);
  const setOpen = useUIStore((s) => s.setCreateProjectModalOpen);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Project Baru">
      {/* Form di-mount hanya saat modal terbuka supaya state useActionState
          (termasuk flag success) ke-reset tiap kali modal dibuka ulang. */}
      {open && <CreateProjectForm onClose={() => setOpen(false)} />}
    </Modal>
  );
}

function CreateProjectForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(
    createProject,
    initialState
  );

  // Tutup modal begitu create sukses; grid sudah refresh via revalidatePath.
  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state, onClose]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        label="Judul"
        name="title"
        placeholder="Judul novel/projectmu"
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
          {pending ? "Membuat..." : "Buat"}
        </Button>
      </div>
    </form>
  );
}
