"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Illustration } from "@/lib/actions/illustrations";
import {
  getImageUrl,
  updateIllustration,
} from "@/lib/actions/illustrations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LinkEntitySelector } from "./LinkEntitySelector";
import { useRouter } from "next/navigation";

type ImageLightboxProps = {
  illustration: Illustration;
  projectId: string;
  onClose: () => void;
};

export function ImageLightbox({
  illustration,
  projectId,
  onClose,
}: ImageLightboxProps) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState(illustration.title);
  const [linkedCharacterId, setLinkedCharacterId] = useState<string | null>(
    illustration.linked_character_id
  );
  const [linkedSceneId, setLinkedSceneId] = useState<string | null>(
    illustration.linked_scene_id
  );
  const [linkedWorldbuildingId, setLinkedWorldbuildingId] = useState<
    string | null
  >(illustration.linked_worldbuilding_id);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const result = await updateIllustration(illustration.id, projectId, {
      title,
      linked_character_id: linkedCharacterId,
      linked_scene_id: linkedSceneId,
      linked_worldbuilding_id: linkedWorldbuildingId,
    });

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.refresh();
    onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col gap-4 overflow-auto rounded-lg bg-parchment p-6 shadow-xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image preview */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded bg-slate/10">
          {loading ? (
            <p className="text-sm text-slate">Loading...</p>
          ) : imageUrl ? (
            <div className="relative h-full w-full">
              <Image
                src={imageUrl}
                alt={illustration.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            </div>
          ) : (
            <p className="text-sm text-slate">Gagal load gambar</p>
          )}
        </div>

        {/* Form edit */}
        <div className="flex w-full flex-col gap-4 md:w-80">
          <h3 className="font-display text-xl font-semibold text-ink">
            Edit Illustration
          </h3>

          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Judul
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul gambar"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Link ke Character
              </label>
              <LinkEntitySelector
                projectId={projectId}
                entityType="character"
                value={linkedCharacterId}
                onChange={setLinkedCharacterId}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Link ke Scene
              </label>
              <LinkEntitySelector
                projectId={projectId}
                entityType="scene"
                value={linkedSceneId}
                onChange={setLinkedSceneId}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Link ke Worldbuilding
              </label>
              <LinkEntitySelector
                projectId={projectId}
                entityType="worldbuilding"
                value={linkedWorldbuildingId}
                onChange={setLinkedWorldbuildingId}
              />
            </div>
          </div>

          {error && (
            <p className="rounded border border-wine/30 bg-wine/5 px-3 py-2 text-sm text-wine">
              {error}
            </p>
          )}

          <div className="mt-auto flex gap-2">
            <Button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex-1"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
