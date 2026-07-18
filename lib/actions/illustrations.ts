"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Illustration = {
  id: string;
  project_id: string;
  title: string;
  image_path: string;
  linked_character_id: string | null;
  linked_scene_id: string | null;
  linked_worldbuilding_id: string | null;
  created_at: string;
  deleted_at: string | null;
};

export type IllustrationActionResult = { error: string | null; id?: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return { supabase, user };
}

export async function getIllustrations(
  projectId: string
): Promise<Illustration[]> {
  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("illustrations")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Illustration[];
}

export async function getIllustration(
  id: string
): Promise<Illustration | null> {
  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("illustrations")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Illustration | null;
}

// Upload image ke Supabase Storage, return path
export async function uploadImage(
  projectId: string,
  file: File
): Promise<IllustrationActionResult> {
  const { supabase, user } = await requireUser();

  // Validasi tipe file (gambar saja)
  if (!file.type.startsWith("image/")) {
    return { error: "File harus berupa gambar" };
  }

  // Validasi ukuran (maks 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Ukuran file maksimal 5MB" };
  }

  // Path: {user_id}/{project_id}/{timestamp}-{filename}
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${user.id}/${projectId}/${timestamp}-${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from("illustrations")
    .upload(filePath, file);

  if (uploadError) {
    return { error: uploadError.message };
  }

  // Buat record di tabel illustrations
  const { data, error: insertError } = await supabase
    .from("illustrations")
    .insert({
      project_id: projectId,
      title: file.name.replace(/\.[^/.]+$/, ""), // nama file tanpa extension
      image_path: filePath,
    })
    .select("id")
    .single();

  if (insertError) {
    // Rollback: hapus file dari Storage kalau insert gagal
    await supabase.storage.from("illustrations").remove([filePath]);
    return { error: insertError.message };
  }

  revalidatePath(`/${projectId}/illustration`);
  return { error: null, id: data.id };
}

// Update metadata illustration (title + linked entities)
export async function updateIllustration(
  id: string,
  projectId: string,
  fields: {
    title: string;
    linked_character_id: string | null;
    linked_scene_id: string | null;
    linked_worldbuilding_id: string | null;
  }
): Promise<IllustrationActionResult> {
  const { supabase } = await requireUser();

  if (!fields.title.trim()) {
    return { error: "Judul tidak boleh kosong" };
  }

  const { error } = await supabase
    .from("illustrations")
    .update({
      title: fields.title.trim(),
      linked_character_id: fields.linked_character_id,
      linked_scene_id: fields.linked_scene_id,
      linked_worldbuilding_id: fields.linked_worldbuilding_id,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/illustration`);
  return { error: null };
}

// Soft-delete (set deleted_at) — konsisten semua modul.
// File di Storage tidak dihapus (biar bisa restore), hapus permanen dari Trash.
export async function deleteIllustration(
  id: string,
  projectId: string
): Promise<IllustrationActionResult> {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("illustrations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/illustration`);
  return { error: null };
}

// Get signed URL untuk akses gambar (bucket private, butuh signed URL)
export async function getImageUrl(path: string): Promise<string | null> {
  const { supabase } = await requireUser();

  const { data, error } = await supabase.storage
    .from("illustrations")
    .createSignedUrl(path, 3600); // valid 1 jam

  if (error) {
    return null;
  }

  return data.signedUrl;
}
