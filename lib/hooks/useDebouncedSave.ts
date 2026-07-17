"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditorStore } from "@/store/useEditorStore";

const DEBOUNCE_MS = 1200;

// Debounced autosave ke Supabase — reusable (editor sekarang, Notes/Character
// dst nanti). Status (saving/saved/failed) dilaporkan ke useEditorStore untuk
// SaveStatusIndicator; retry terdaftar di store juga biar logic gak duplikat.
export function useDebouncedSave(
  id: string,
  save: (id: string, content: string) => Promise<{ error: string | null }>
) {
  const setStatus = useEditorStore((s) => s.setSceneStatus);
  const registerRetry = useEditorStore((s) => s.registerRetry);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Konten terakhir yang diminta save — dipakai flush & retry
  const pendingRef = useRef<string | null>(null);
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const doSave = useCallback(async () => {
    const content = pendingRef.current;
    if (content === null) return;

    setStatus(id, "saving");
    try {
      const result = await saveRef.current(id, content);
      if (result.error) {
        setStatus(id, "failed");
      } else {
        // Kalau user ngetik lagi selama request jalan, pendingRef sudah
        // berubah — biarkan timer berikutnya yang nge-save.
        if (pendingRef.current === content) {
          pendingRef.current = null;
        }
        setStatus(id, "saved");
      }
    } catch {
      setStatus(id, "failed");
    }
  }, [id, setStatus]);

  const scheduleSave = useCallback(
    (content: string) => {
      pendingRef.current = content;
      setStatus(id, "saving");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void doSave();
      }, DEBOUNCE_MS);
    },
    [id, doSave, setStatus]
  );

  // Retry manual dari SaveStatusIndicator: save ulang konten pending tanpa debounce
  useEffect(() => {
    registerRetry(id, () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      void doSave();
    });
  }, [id, registerRetry, doSave]);

  // Flush on unmount: kalau masih ada pending, langsung tembak (best effort)
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pendingRef.current !== null) {
        void doSave();
      }
    };
  }, [doSave]);

  return { scheduleSave };
}
