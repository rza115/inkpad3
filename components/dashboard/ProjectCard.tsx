"use client";

import Link from "next/link";
import type { Project } from "@/lib/actions/projects";
import { ProjectCardMenu } from "./ProjectCardMenu";

export function ProjectCard({ project }: { project: Project }) {
  const createdAt = new Date(project.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="group relative flex min-h-40 flex-col justify-between rounded-lg border border-ink/10 bg-parchment p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Ribbon — signature element, penanda kartu project */}
      <span
        aria-hidden
        className="absolute -top-1 right-4 h-6 w-3 bg-wine [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]"
      />

      <Link
        href={`/${project.id}`}
        className="flex flex-1 flex-col gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
      >
        <h2 className="font-display text-lg font-semibold text-ink group-hover:text-wine">
          {project.title}
        </h2>
      </Link>

      <div className="flex items-end justify-between">
        <span className="font-mono text-xs text-slate">{createdAt}</span>
        <ProjectCardMenu project={project} />
      </div>
    </div>
  );
}
