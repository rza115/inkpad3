"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// character_relationships: tabel terpisah dari characters karena query
// pattern-nya beda — join dua arah character_id ↔ related_character_id.

export type CharacterRelationship = {
  id: string;
  project_id: string;
  character_id: string;
  related_character_id: string;
  relationship_type: string;
  notes: string;
  created_at: string;
};

export type RelationshipActionResult = { error: string | null };

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

// Ambil relasi dua arah: karakter ini sebagai character_id ATAU related_character_id.
export async function getRelationships(
  characterId: string
): Promise<CharacterRelationship[]> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("character_relationships")
    .select("*")
    .or(
      `character_id.eq.${characterId},related_character_id.eq.${characterId}`
    )
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as CharacterRelationship[];
}

export async function createRelationship(
  projectId: string,
  characterId: string,
  relatedCharacterId: string,
  relationshipType: string,
  notes: string
): Promise<RelationshipActionResult> {
  const supabase = await requireUser();

  if (!relationshipType.trim()) {
    return { error: "Tipe relasi tidak boleh kosong" };
  }
  if (characterId === relatedCharacterId) {
    return { error: "Karakter tidak bisa berelasi dengan dirinya sendiri" };
  }

  const { error } = await supabase.from("character_relationships").insert({
    project_id: projectId,
    character_id: characterId,
    related_character_id: relatedCharacterId,
    relationship_type: relationshipType.trim(),
    notes,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/characters`);
  return { error: null };
}

// Hard delete: relasi bukan entitas utama (tidak ada deleted_at di data
// model) — hapus relasi tidak menghilangkan karya tulis apapun.
export async function deleteRelationship(
  id: string,
  projectId: string
): Promise<RelationshipActionResult> {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("character_relationships")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/characters`);
  return { error: null };
}
