"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // Klik backdrop = close
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto w-full max-w-md rounded-lg bg-parchment p-0 text-ink shadow-xl backdrop:bg-ink/60"
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded px-2 py-1 text-slate hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-slate"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
