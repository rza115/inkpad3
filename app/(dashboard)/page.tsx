import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjects } from "@/lib/actions/projects";
import { signOut } from "@/lib/actions/auth";
import { ProjectGrid } from "@/components/dashboard/ProjectGrid";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const projects = await getProjects();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-ink/10 bg-ink px-6 py-4">
        <span className="font-display text-xl font-semibold text-parchment">
          InkPad
        </span>
        <div className="flex items-center gap-4">
          <span className="hidden font-mono text-xs text-parchment/60 sm:inline">
            {user.email}
          </span>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              className="text-parchment/80 hover:bg-parchment/10 hover:text-parchment"
            >
              Keluar
            </Button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-6">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Rak Buku
        </h1>
        <ProjectGrid projects={projects} />
      </main>
    </div>
  );
}
