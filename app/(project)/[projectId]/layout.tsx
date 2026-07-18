import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/actions/projects";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";

// Shell di dalam satu project: Topbar + Sidebar + content slot.
// Semua section (outline/notes/characters/dst) otomatis dapat shell ini.
export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<"/[projectId]">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex h-dvh flex-col">
      <Topbar projectTitle={project.title} projectId={project.id} />
      <div className="flex min-h-0 flex-1">
        <Sidebar projectId={project.id} />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
      <MobileNav projectId={project.id} />
    </div>
  );
}
