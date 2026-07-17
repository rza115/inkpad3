"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Note = {
  id: string;
  project_id: string;
  title: string;
  content: string;
  linked_chapter_id: string | null;
  created_at: string;
  deleted_at: string | null;
};

export type NoteActionResult = { error: string | null };

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

export async function getNotes(projectId: string): Promise<Note[]> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Note[];
}

export async function createNote(
  projectId: string,
  title: string
): Promise<NoteActionResult> {
  const supabase = await requireUser();

  const trimmed = title.trim();
  if (!trimmed) {
    return { error: "Judul note tidak boleh kosong" };
  }

  const { error } = await supabase
    .from("notes")
    .insert({ project_id: projectId, title: trimmed });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/notes`);
  return { error: null };
}

export async function updateNote(
  id: string,
  projectId: string,
  fields: { title?: string; linked_chapter_id?: string | null }
): Promise<NoteActionResult> {
  const supabase = await requireUser();

  if (fields.title !== undefined && !fields.title.trim()) {
    return { error: "Judul note tidak boleh kosong" };
  }

  const { error } = await supabase
    .from("notes")
    .update({
      ...(fields.title !== undefined && { title: fields.title.trim() }),
      ...(fields.linked_chapter_id !== undefined && {
        linked_chapter_id: fields.linked_chapter_id,
      }),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/notes`);
  return { error: null };
}

// Autosave konten dari NoteEditor (pola updateSceneContent: tanpa revalidate)
export async function updateNoteContent(
  id: string,
  content: string
): Promise<NoteActionResult> {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("notes")
    .update({ content })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// Soft-delete (set deleted_at) — konsisten semua modul.
export async function deleteNote(
  id: string,
  projectId: string
): Promise<NoteActionResult> {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/notes`);
  return { error: null };
}
