"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type WorldbuildingEntry = {
  id: string;
  project_id: string;
  category: string;
  title: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
};

export type WorldbuildingActionResult = { error: string | null };

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

export async function getWorldbuildingEntries(
  projectId: string
): Promise<WorldbuildingEntry[]> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("worldbuilding_entries")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as WorldbuildingEntry[];
}

export async function createWorldbuildingEntry(
  projectId: string,
  fields: { title: string; category: string; content: string }
): Promise<WorldbuildingActionResult> {
  const supabase = await requireUser();

  if (!fields.title.trim()) {
    return { error: "Judul entry tidak boleh kosong" };
  }
  if (!fields.category.trim()) {
    return { error: "Kategori tidak boleh kosong" };
  }

  const { error } = await supabase.from("worldbuilding_entries").insert({
    project_id: projectId,
    title: fields.title.trim(),
    category: fields.category.trim(),
    content: fields.content,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/worldbuilding`);
  return { error: null };
}

export async function updateWorldbuildingEntry(
  id: string,
  projectId: string,
  fields: { title: string; category: string; content: string }
): Promise<WorldbuildingActionResult> {
  const supabase = await requireUser();

  if (!fields.title.trim()) {
    return { error: "Judul entry tidak boleh kosong" };
  }
  if (!fields.category.trim()) {
    return { error: "Kategori tidak boleh kosong" };
  }

  const { error } = await supabase
    .from("worldbuilding_entries")
    .update({
      title: fields.title.trim(),
      category: fields.category.trim(),
      content: fields.content,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/worldbuilding`);
  return { error: null };
}

// Soft-delete (set deleted_at) — konsisten semua modul.
export async function deleteWorldbuildingEntry(
  id: string,
  projectId: string
): Promise<WorldbuildingActionResult> {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("worldbuilding_entries")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/worldbuilding`);
  return { error: null };
}
