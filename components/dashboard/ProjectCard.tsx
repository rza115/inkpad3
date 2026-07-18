"use client";

import Link from "next/link";
import type { Project } from "@/lib/actions/projects";
import { ProjectCardMenu } from "./ProjectCardMenu";
import { BookCover } from "./BookCover";

export function ProjectCard({ project }: { project: Project }) {
  const createdAt = new Date(project.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="group relative aspect-[2/3] overflow-hidden rounded-l rounded-r-lg shadow-sm transition-shadow hover:shadow-md">
      <BookCover id={project.id} />

      {/* Spine — dua strip tipis di kiri, kesan buku berdiri di rak */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 z-10 w-[7px] bg-black/20"
      />
      <span
        aria-hidden
        className="absolute inset-y-0 left-[7px] z-10 w-[3px] bg-white/15"
      />

      {/* Scrim — gradasi gelap di bawah biar judul putih tetap kebaca */}
      <div
        aria-hidden
        className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
      />

      {/* Ribbon — signature element, penanda kartu project */}
      <span
        aria-hidden
        className="absolute -top-1 right-4 z-20 h-6 w-3 bg-wine [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]"
      />

      <Link
        href={`/${project.id}`}
        className="absolute inset-0 z-20 flex flex-col justify-end p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-parchment"
      >
        <h2 className="font-display text-base font-semibold leading-tight text-parchment">
          {project.title}
        </h2>
        <div className="mt-1.5 flex items-end justify-between">
          <span className="font-mono text-[11px] text-parchment/70">
            {createdAt}
          </span>
        </div>
      </Link>

      <div className="absolute bottom-3 right-3 z-30">
        <ProjectCardMenu project={project} />
      </div>
    </div>
  );
}
