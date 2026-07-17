"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PlotStatus = "planned" | "in_progress" | "resolved";

export type PlotPoint = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  order: number;
  linked_chapter_id: string | null;
  status: PlotStatus;
  created_at: string;
  deleted_at: string | null;
};

export type PlotActionResult = { error: string | null };

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

export async function getPlotPoints(projectId: string): Promise<PlotPoint[]> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("plot_points")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as PlotPoint[];
}

export async function createPlotPoint(
  projectId: string,
  title: string
): Promise<PlotActionResult> {
  const supabase = await requireUser();

  const trimmed = title.trim();
  if (!trimmed) {
    return { error: "Judul plot point tidak boleh kosong" };
  }

  const { data: last } = await supabase
    .from("plot_points")
    .select('"order"')
    .eq("project_id", projectId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("plot_points").insert({
    project_id: projectId,
    title: trimmed,
    order: (last?.order ?? -1) + 1,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/plot`);
  return { error: null };
}

export async function updatePlotPoint(
  id: string,
  projectId: string,
  fields: {
    title?: string;
    description?: string;
    status?: PlotStatus;
    linked_chapter_id?: string | null;
  }
): Promise<PlotActionResult> {
  const supabase = await requireUser();

  if (fields.title !== undefined && !fields.title.trim()) {
    return { error: "Judul plot point tidak boleh kosong" };
  }

  const { error } = await supabase
    .from("plot_points")
    .update({
      ...(fields.title !== undefined && { title: fields.title.trim() }),
      ...(fields.description !== undefined && {
        description: fields.description,
      }),
      ...(fields.status !== undefined && { status: fields.status }),
      ...(fields.linked_chapter_id !== undefined && {
        linked_chapter_id: fields.linked_chapter_id,
      }),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/plot`);
  return { error: null };
}

export async function updatePlotPointOrder(
  projectId: string,
  orderedIds: string[]
): Promise<PlotActionResult> {
  const supabase = await requireUser();

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("plot_points")
        .update({ order: index })
        .eq("id", id)
        .eq("project_id", projectId)
    )
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return { error: failed.error.message };
  }

  revalidatePath(`/${projectId}/plot`);
  return { error: null };
}

// Soft-delete (set deleted_at) — konsisten semua modul.
export async function deletePlotPoint(
  id: string,
  projectId: string
): Promise<PlotActionResult> {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("plot_points")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${projectId}/plot`);
  return { error: null };
}
