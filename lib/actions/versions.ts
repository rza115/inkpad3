"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Snapshot per CHAPTER (keputusan user): satu row chapter_versions menyimpan
// seluruh isi chapter (semua scene) sebagai JSON di content_snapshot.
// scene_versions menyimpan konten per scene di tiap snapshot (record granular).
// Snapshot dibuat MANUAL lewat tombol "Simpan Versi" — bukan otomatis.

export type ChapterVersion = {
  id: string;
  chapter_id: string;
  content_snapshot: string;
  created_at: string;
};

export type VersionSnapshot = {
  chapter_title: string;
  scenes: { id: string; order: number; content: string }[];
};

export type VersionActionResult = { error: string | null };

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

export async function getVersions(
  chapterId: string
): Promise<ChapterVersion[]> {
  const supabase = await requireUser();

  const { data, error } = await supabase
    .from("chapter_versions")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as ChapterVersion[];
}

export async function createChapterVersion(
  chapterId: string
): Promise<VersionActionResult> {
  const supabase = await requireUser();

  // Ambil kondisi chapter + scene saat ini langsung dari Supabase
  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("title")
    .eq("id", chapterId)
    .is("deleted_at", null)
    .maybeSingle();

  if (chapterError || !chapter) {
    return { error: chapterError?.message ?? "Chapter tidak ditemukan" };
  }

  const { data: scenes, error: scenesError } = await supabase
    .from("scenes")
    .select('id, "order", content')
    .eq("chapter_id", chapterId)
    .is("deleted_at", null)
    .order("order", { ascending: true });

  if (scenesError) {
    return { error: scenesError.message };
  }

  const snapshot: VersionSnapshot = {
    chapter_title: chapter.title,
    scenes: (scenes ?? []) as VersionSnapshot["scenes"],
  };

  const { data: version, error: insertError } = await supabase
    .from("chapter_versions")
    .insert({
      chapter_id: chapterId,
      content_snapshot: JSON.stringify(snapshot),
    })
    .select("id")
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  // Record granular per scene di scene_versions (ikut skema data model)
  if (snapshot.scenes.length > 0) {
    const { error: sceneVersionError } = await supabase
      .from("scene_versions")
      .insert(
        snapshot.scenes.map((s) => ({
          scene_id: s.id,
          content_snapshot: s.content,
        }))
      );

    if (sceneVersionError) {
      // Snapshot utama sudah tersimpan; kegagalan record granular tidak
      // membatalkan versi, cukup dilaporkan.
      return { error: `Versi tersimpan, tapi record per scene gagal: ${sceneVersionError.message}` };
    }
  }

  void version;
  return { error: null };
}

// Rollback: kembalikan konten & urutan semua scene di snapshot. Scene yang
// sudah soft-deleted di-restore (deleted_at = null). Scene baru yang dibuat
// setelah snapshot dibiarkan (tidak dihapus) — rollback bukan destruktif.
export async function rollbackToVersion(
  versionId: string,
  chapterId: string,
  projectId: string
): Promise<VersionActionResult> {
  const supabase = await requireUser();

  const { data: version, error: versionError } = await supabase
    .from("chapter_versions")
    .select("content_snapshot")
    .eq("id", versionId)
    .eq("chapter_id", chapterId)
    .maybeSingle();

  if (versionError || !version) {
    return { error: versionError?.message ?? "Versi tidak ditemukan" };
  }

  let snapshot: VersionSnapshot;
  try {
    snapshot = JSON.parse(version.content_snapshot) as VersionSnapshot;
  } catch {
    return { error: "Snapshot rusak — tidak bisa di-parse" };
  }

  const results = await Promise.all(
    snapshot.scenes.map((s) =>
      supabase
        .from("scenes")
        .update({ content: s.content, order: s.order, deleted_at: null })
        .eq("id", s.id)
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
