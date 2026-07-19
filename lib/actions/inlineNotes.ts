"use server";

import { createClient } from "@/lib/supabase/server";

// Fase 11: inline margin note — catatan nempel ke rentang teks di scene,
// ditandai mark <span data-note-id="..."> di HTML scene.content.
// Hard delete (bukan soft-delete): bukan entitas utama, tak ada di Trash,
// pola sama character_relationships. Tanpa revalidatePath — sama seperti
// updateSceneContent: data hidup di React state selama halaman terbuka,
// fresh diambil ulang pas navigasi/reload lewat getInlineNotes.

export type InlineNote = {
  id: string;
  scene_id: string;
  content: string;
  created_at: string;
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

export async function getInlineNotes(sceneId: string): Promise<InlineNote[]> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("inline_notes")
    .select("*")
    .eq("scene_id", sceneId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as InlineNote[];
}

// Return row baru (butuh id-nya buat dijadikan attribute mark di editor).
export async function createInlineNote(
  sceneId: string,
  content: string
): Promise<InlineNote | { error: string }> {
  const supabase = await requireUser();

  const trimmed = content.trim();
  if (!trimmed) {
    return { error: "Isi catatan tidak boleh kosong" };
  }

  const { data, error } = await supabase
    .from("inline_notes")
    .insert({ scene_id: sceneId, content: trimmed })
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  return data as InlineNote;
}

export async function deleteInlineNote(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await requireUser();

  const { error } = await supabase.from("inline_notes").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// Reconciliation (Step 6): dipanggil bareng autosave. Hapus row inline_notes
// yang mark-nya sudah hilang dari HTML final (user hapus/edit teksnya sampai
// span kebuang). activeNoteIds = semua data-note-id yang MASIH ada di HTML.
export async function deleteOrphanedInlineNotes(
  sceneId: string,
  activeNoteIds: string[]
): Promise<void> {
  const supabase = await requireUser();

  const query = supabase.from("inline_notes").delete().eq("scene_id", sceneId);

  // Tak ada mark tersisa → semua note scene ini orphan, hapus semua.
  // Ada mark tersisa → hapus yang id-nya TIDAK ada di daftar aktif.
  if (activeNoteIds.length > 0) {
    query.not("id", "in", `(${activeNoteIds.join(",")})`);
  }

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }
}
