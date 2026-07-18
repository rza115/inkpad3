"use client";

import { useState } from "react";
import type { Illustration } from "@/lib/actions/illustrations";
import { Button } from "@/components/ui/Button";
import { IllustrationCard } from "./IllustrationCard";
import { UploadDropzone } from "./UploadDropzone";
import { ImageLightbox } from "./ImageLightbox";

type IllustrationGalleryProps = {
  projectId: string;
  illustrations: Illustration[];
};

export function IllustrationGallery({
  projectId,
  illustrations,
}: IllustrationGalleryProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIllustration, setSelectedIllustration] =
    useState<Illustration | null>(null);

  const handleOpenLightbox = (illustration: Illustration) => {
    setSelectedIllustration(illustration);
    setLightboxOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setUploadOpen(true)}>
          + Upload gambar
        </Button>
      </div>

      {uploadOpen && (
        <div className="rounded-lg border border-slate/30 bg-parchment/10 p-4">
          <UploadDropzone
            projectId={projectId}
            onComplete={() => setUploadOpen(false)}
            onCancel={() => setUploadOpen(false)}
          />
        </div>
      )}

      {illustrations.length === 0 ? (
        <p className="rounded border border-slate/30 border-dashed px-4 py-8 text-center text-sm text-slate">
          Belum ada illustration — upload yang pertama.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {illustrations.map((illustration) => (
            <IllustrationCard
              key={illustration.id}
              projectId={projectId}
              illustration={illustration}
              onOpenLightbox={() => handleOpenLightbox(illustration)}
            />
          ))}
        </ul>
      )}

      {lightboxOpen && selectedIllustration && (
        <ImageLightbox
          illustration={selectedIllustration}
          projectId={projectId}
          onClose={() => {
            setLightboxOpen(false);
            setSelectedIllustration(null);
          }}
        />
      )}
    </div>
  );
}
