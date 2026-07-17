"use client";

import type { Project } from "@/lib/actions/projects";
import { useUIStore } from "@/store/useUIStore";
import { ProjectCard } from "./ProjectCard";
import { CreateProjectModal } from "./CreateProjectModal";
import { Button } from "@/components/ui/Button";

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const setCreateProjectModalOpen = useUIStore(
    (s) => s.setCreateProjectModalOpen
  );

  return (
    <>
      {projects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate/40 p-12 text-center">
          <p className="text-slate">
            Rak masih kosong. Mulai project pertamamu.
          </p>
          <Button onClick={() => setCreateProjectModalOpen(true)}>
            + Project Baru
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => setCreateProjectModalOpen(true)}
            className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-slate/40 text-slate transition-colors hover:border-wine hover:text-wine focus-visible:outline-2 focus-visible:outline-wine"
          >
            + Project Baru
          </button>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
      <CreateProjectModal />
    </>
  );
}
