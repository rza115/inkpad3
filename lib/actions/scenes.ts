"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Scene = {
  id: string;
  chapter_id: string;
  content: string;
  order: number;
  created_at: string;
  deleted_at: string | null;
};

export type SceneActionResult = { error: string | null };

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

export async function getScenes(chapterId: string): Promise<Scene[]> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("chapter_id", chapterId)
    .is("deleted_at", null)
    .order("order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as Scene[];
}

export async function createScene(
  chapterId: string,
  projectId: string
): Promise<SceneActionResult> {
  const supabase = await requireUser();

  const { data: last } = await supabase
    .from("scenes")
    .select('"order"')
    .eq("chapter_id", chapterId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("scenes").insert({
    chapter_id: chapterId,
    content: "",
    order: (last?.order ?? -1) + 1,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}`, "layout");
  return { error: null };
}

// Autosave debounced dari editor — dipanggil useDebouncedSave, TANPA
// revalidatePath: konten hidup di TipTap selama halaman terbuka, revalidate
// tiap ketikan cuma bikin re-render sia-sia. Data fresh diambil pas navigasi.
export async function updateSceneContent(
  id: string,
  content: string
): Promise<SceneActionResult> {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("scenes")
    .update({ content })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function updateSceneOrder(
  chapterId: string,
  projectId: string,
  orderedIds: string[]
): Promise<SceneActionResult> {
  const supabase = await requireUser();

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("scenes")
        .update({ order: index })
        .eq("id", id)
        .eq("chapter_id", chapterId)
    )
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return { error: failed.error.message };
  }

  revalidatePath(`/${projectId}`, "layout");
  return { error: null };
}

// Soft-delete (set deleted_at) — konsisten dengan projects.ts/chapters.ts.
export async function deleteScene(
  id: string,
  projectId: string
): Promise<SceneActionResult> {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("scenes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}`, "layout");
  return { error: null };
}
