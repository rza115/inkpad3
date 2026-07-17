"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ChapterStatus = "draft" | "revisi" | "selesai";

export type Chapter = {
  id: string;
  project_id: string;
  title: string;
  order: number;
  status: ChapterStatus;
  created_at: string;
  deleted_at: string | null;
};

export type ChapterActionResult = { error: string | null };

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

export async function getChapters(projectId: string): Promise<Chapter[]> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as Chapter[];
}

export async function getChapter(id: string): Promise<Chapter | null> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Chapter | null;
}

export async function createChapter(
  projectId: string,
  title: string
): Promise<ChapterActionResult> {
  const supabase = await requireUser();

  const trimmed = title.trim();
  if (!trimmed) {
    return { error: "Judul chapter tidak boleh kosong" };
  }

  // Order berikutnya = order tertinggi (termasuk yang soft-deleted, biar tidak tabrakan) + 1
  const { data: last } = await supabase
    .from("chapters")
    .select('"order"')
    .eq("project_id", projectId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("chapters").insert({
    project_id: projectId,
    title: trimmed,
    order: (last?.order ?? -1) + 1,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}`, "layout");
  return { error: null };
}

export async function renameChapter(
  id: string,
  projectId: string,
  title: string
): Promise<ChapterActionResult> {
  const supabase = await requireUser();

  const trimmed = title.trim();
  if (!trimmed) {
    return { error: "Judul chapter tidak boleh kosong" };
  }

  const { error } = await supabase
    .from("chapters")
    .update({ title: trimmed })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}`, "layout");
  return { error: null };
}

export async function updateChapterStatus(
  id: string,
  projectId: string,
  status: ChapterStatus
): Promise<ChapterActionResult> {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("chapters")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}`, "layout");
  return { error: null };
}

// Terima urutan id hasil drag-drop, tulis order = index langsung ke DB.
export async function updateChapterOrder(
  projectId: string,
  orderedIds: string[]
): Promise<ChapterActionResult> {
  const supabase = await requireUser();

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("chapters")
        .update({ order: index })
        .eq("id", id)
        .eq("project_id", projectId)
    )
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return { error: failed.error.message };
  }

  revalidatePath(`/${projectId}`, "layout");
  return { error: null };
}

// Soft-delete (set deleted_at) — konsisten dengan projects.ts.
export async function deleteChapter(
  id: string,
  projectId: string
): Promise<ChapterActionResult> {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("chapters")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}`, "layout");
  return { error: null };
}
