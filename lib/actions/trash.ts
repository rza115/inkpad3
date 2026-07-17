"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Query lintas-tabel: semua entitas dengan deleted_at terisi dalam satu
// project. Sengaja dipisah dari action file per tabel karena scope-nya
// cross-modul.

export type TrashEntityType =
  | "chapter"
  | "scene"
  | "note"
  | "character"
  | "plot_point"
  | "worldbuilding_entry"
  | "illustration";

export type TrashItem = {
  type: TrashEntityType;
  id: string;
  label: string;
  deleted_at: string;
};

export type TrashActionResult = { error: string | null };

const TABLE_BY_TYPE: Record<TrashEntityType, string> = {
  chapter: "chapters",
  scene: "scenes",
  note: "notes",
  character: "characters",
  plot_point: "plot_points",
  worldbuilding_entry: "worldbuilding_entries",
  illustration: "illustrations",
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return supabase;
}

function sceneLabel(content: string): string {
  const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return "(scene kosong)";
  return text.length > 50 ? `${text.slice(0, 50)}…` : text;
}

export async function getDeletedItems(projectId: string): Promise<TrashItem[]> {
  const supabase = await requireUser();

  // Query paralel semua tabel; scenes lewat join chapters (gak punya project_id)
  const [chapters, scenes, notes, characters, plotPoints, worldbuilding, illustrations] =
    await Promise.all([
      supabase
        .from("chapters")
        .select("id, title, deleted_at")
        .eq("project_id", projectId)
        .not("deleted_at", "is", null),
      supabase
        .from("scenes")
        .select("id, content, deleted_at, chapters!inner(project_id)")
        .eq("chapters.project_id", projectId)
        .not("deleted_at", "is", null),
      supabase
        .from("notes")
        .select("id, title, deleted_at")
        .eq("project_id", projectId)
        .not("deleted_at", "is", null),
      supabase
        .from("characters")
        .select("id, name, deleted_at")
        .eq("project_id", projectId)
        .not("deleted_at", "is", null),
      supabase
        .from("plot_points")
        .select("id, title, deleted_at")
        .eq("project_id", projectId)
        .not("deleted_at", "is", null),
      supabase
        .from("worldbuilding_entries")
        .select("id, title, deleted_at")
        .eq("project_id", projectId)
        .not("deleted_at", "is", null),
      supabase
        .from("illustrations")
        .select("id, title, deleted_at")
        .eq("project_id", projectId)
        .not("deleted_at", "is", null),
    ]);

  const failed = [chapters, scenes, notes, characters, plotPoints, worldbuilding, illustrations].find(
    (r) => r.error
  );
  if (failed?.error) {
    throw new Error(failed.error.message);
  }

  const items: TrashItem[] = [
    ...(chapters.data ?? []).map((r) => ({
      type: "chapter" as const,
      id: r.id as string,
      label: r.title as string,
      deleted_at: r.deleted_at as string,
    })),
    ...(scenes.data ?? []).map((r) => ({
      type: "scene" as const,
      id: r.id as string,
      label: sceneLabel(r.content as string),
      deleted_at: r.deleted_at as string,
    })),
    ...(notes.data ?? []).map((r) => ({
      type: "note" as const,
      id: r.id as string,
      label: r.title as string,
      deleted_at: r.deleted_at as string,
    })),
    ...(characters.data ?? []).map((r) => ({
      type: "character" as const,
      id: r.id as string,
      label: r.name as string,
      deleted_at: r.deleted_at as string,
    })),
    ...(plotPoints.data ?? []).map((r) => ({
      type: "plot_point" as const,
      id: r.id as string,
      label: r.title as string,
      deleted_at: r.deleted_at as string,
    })),
    ...(worldbuilding.data ?? []).map((r) => ({
      type: "worldbuilding_entry" as const,
      id: r.id as string,
      label: r.title as string,
      deleted_at: r.deleted_at as string,
    })),
    ...(illustrations.data ?? []).map((r) => ({
      type: "illustration" as const,
      id: r.id as string,
      label: r.title as string,
      deleted_at: r.deleted_at as string,
    })),
  ];

  // Terbaru dihapus di atas
  return items.sort((a, b) => b.deleted_at.localeCompare(a.deleted_at));
}

export async function restoreItem(
  type: TrashEntityType,
  id: string,
  projectId: string
): Promise<TrashActionResult> {
  const supabase = await requireUser();

  const { error } = await supabase
    .from(TABLE_BY_TYPE[type])
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}`, "layout");
  return { error: null };
}

// Satu-satunya DELETE FROM beneran — hanya dari halaman Trash, manual.
export async function permanentDelete(
  type: TrashEntityType,
  id: string,
  projectId: string
): Promise<TrashActionResult> {
  const supabase = await requireUser();

  const { error } = await supabase
    .from(TABLE_BY_TYPE[type])
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/trash`);
  return { error: null };
}
