"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CharacterRole = "protagonist" | "antagonist" | "side";

export type Character = {
  id: string;
  project_id: string;
  name: string;
  description: string;
  role: CharacterRole;
  arc_notes: string;
  aliases: string[];
  quick_summary: string;
  created_at: string;
  deleted_at: string | null;
};

export type CharacterActionResult = { error: string | null };

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

export async function getCharacters(projectId: string): Promise<Character[]> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as Character[];
}

export async function getCharacter(id: string): Promise<Character | null> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Character | null;
}

export async function createCharacter(
  projectId: string,
  fields: {
    name: string;
    description: string;
    role: CharacterRole;
    arc_notes: string;
    aliases: string[];
    quick_summary: string;
  }
): Promise<CharacterActionResult> {
  const supabase = await requireUser();

  if (!fields.name.trim()) {
    return { error: "Nama karakter tidak boleh kosong" };
  }

  const { error } = await supabase.from("characters").insert({
    project_id: projectId,
    name: fields.name.trim(),
    description: fields.description,
    role: fields.role,
    arc_notes: fields.arc_notes,
    aliases: fields.aliases.map((a) => a.trim()).filter(Boolean),
    quick_summary: fields.quick_summary.trim(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/characters`);
  return { error: null };
}

export async function updateCharacter(
  id: string,
  projectId: string,
  fields: {
    name: string;
    description: string;
    role: CharacterRole;
    arc_notes: string;
    aliases: string[];
    quick_summary: string;
  }
): Promise<CharacterActionResult> {
  const supabase = await requireUser();

  if (!fields.name.trim()) {
    return { error: "Nama karakter tidak boleh kosong" };
  }

  const { error } = await supabase
    .from("characters")
    .update({
      name: fields.name.trim(),
      description: fields.description,
      role: fields.role,
      arc_notes: fields.arc_notes,
      aliases: fields.aliases.map((a) => a.trim()).filter(Boolean),
      quick_summary: fields.quick_summary.trim(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/characters`);
  return { error: null };
}

// Soft-delete (set deleted_at) — konsisten semua modul.
export async function deleteCharacter(
  id: string,
  projectId: string
): Promise<CharacterActionResult> {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("characters")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/characters`);
  return { error: null };
}
