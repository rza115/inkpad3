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
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <button
            type="button"
            onClick={() => setCreateProjectModalOpen(true)}
            className="flex aspect-[2/3] flex-col items-center justify-center gap-2 rounded-l rounded-r-lg border border-dashed border-slate/40 text-slate transition-colors hover:border-wine hover:text-wine focus-visible:outline-2 focus-visible:outline-wine"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-sm">Project Baru</span>
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
