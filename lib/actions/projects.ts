"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Project = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  deleted_at: string | null;
};

export type ProjectActionState = {
  error: string | null;
  success?: boolean;
};

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Project[];
}

// Satu project by id (dipakai layout shell (project)/[projectId]). RLS yang
// memastikan hanya pemilik yang dapat baris — null kalau tak ada/deleted/bukan milik user.
export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Project | null;
}

export async function createProject(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const title = (formData.get("title") as string)?.trim();
  if (!title) {
    return { error: "Judul project tidak boleh kosong" };
  }

  const { error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, title });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { error: null, success: true };
}

export async function renameProject(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  const title = (formData.get("title") as string)?.trim();
  if (!id || !title) {
    return { error: "Judul project tidak boleh kosong" };
  }

  const { error } = await supabase
    .from("projects")
    .update({ title })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { error: null, success: true };
}

// Soft-delete (set deleted_at) — konsisten sejak Fase 1, bukan DELETE FROM.
export async function deleteProject(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  if (!id) {
    return { error: "Project tidak ditemukan" };
  }

  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { error: null, success: true };
}
