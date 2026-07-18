"use client";

import { useState, useRef } from "react";
import { uploadImage } from "@/lib/actions/illustrations";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

type UploadDropzoneProps = {
  projectId: string;
  onComplete: () => void;
  onCancel: () => void;
};

export function UploadDropzone({
  projectId,
  onComplete,
  onCancel,
}: UploadDropzoneProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // Upload satu file per kali

    setUploading(true);
    setError(null);

    const result = await uploadImage(projectId, file);

    if (result.error) {
      setError(result.error);
      setUploading(false);
      return;
    }

    router.refresh();
    onComplete();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 transition ${
          dragging
            ? "border-wine bg-wine/5"
            : "border-slate/30 hover:border-slate/50"
        }`}
      >
        <p className="text-sm font-medium text-ink">
          {dragging
            ? "Drop file di sini"
            : "Klik atau drag-and-drop gambar di sini"}
        </p>
        <p className="font-mono text-xs text-slate">
          PNG, JPG, WEBP — maks 5MB
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {error && (
        <p className="rounded border border-wine/30 bg-wine/5 px-3 py-2 text-sm text-wine">
          {error}
        </p>
      )}

      {uploading && (
        <p className="text-center text-sm text-slate">Uploading...</p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onCancel}
          disabled={uploading}
          className="flex-1"
        >
          Batal
        </Button>
      </div>
    </div>
  );
}
