"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Illustration } from "@/lib/actions/illustrations";
import { getImageUrl, deleteIllustration } from "@/lib/actions/illustrations";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

type IllustrationCardProps = {
  projectId: string;
  illustration: Illustration;
  onOpenLightbox: () => void;
};

export function IllustrationCard({
  projectId,
  illustration,
  onOpenLightbox,
}: IllustrationCardProps) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchUrl() {
      const url = await getImageUrl(illustration.image_path);
      if (mounted) {
        setImageUrl(url);
        setLoading(false);
      }
    }

    fetchUrl();

    return () => {
      mounted = false;
    };
  }, [illustration.image_path]);

  const handleDelete = async () => {
    if (!confirm("Hapus illustration ini? (Bisa di-restore dari Trash)")) {
      return;
    }

    setDeleting(true);
    const result = await deleteIllustration(illustration.id, projectId);

    if (result.error) {
      alert(result.error);
      setDeleting(false);
      return;
    }

    router.refresh();
  };

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-lg border border-slate/30 bg-parchment shadow-sm transition hover:shadow-md">
      {/* Image preview */}
      <button
        type="button"
        onClick={onOpenLightbox}
        className="relative aspect-video w-full overflow-hidden bg-slate/10"
        disabled={loading || !imageUrl}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-slate">Loading...</span>
          </div>
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt={illustration.title}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-slate">Gagal load</span>
          </div>
        )}
      </button>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-1 text-sm font-medium text-ink">
          {illustration.title}
        </h3>

        {/* Linked entities badges */}
        <div className="flex flex-wrap gap-1">
          {illustration.linked_character_id && (
            <span className="rounded bg-wine/10 px-1.5 py-0.5 font-mono text-xs text-wine">
              Character
            </span>
          )}
          {illustration.linked_scene_id && (
            <span className="rounded bg-brass/10 px-1.5 py-0.5 font-mono text-xs text-brass">
              Scene
            </span>
          )}
          {illustration.linked_worldbuilding_id && (
            <span className="rounded bg-slate/10 px-1.5 py-0.5 font-mono text-xs text-slate">
              Worldbuilding
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="relative mt-auto flex gap-2">
          <Button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex-1 text-xs"
          >
            ⋯
          </Button>

          {menuOpen && (
            <div className="absolute bottom-full left-0 z-10 mb-1 flex w-full flex-col gap-1 rounded border border-slate/30 bg-parchment p-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  // Edit akan dibuka di lightbox
                  onOpenLightbox();
                }}
                className="rounded px-2 py-1 text-left text-xs hover:bg-slate/10"
              >
                Edit info & link
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleDelete();
                }}
                disabled={deleting}
                className="rounded px-2 py-1 text-left text-xs text-wine hover:bg-wine/10 disabled:opacity-50"
              >
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
