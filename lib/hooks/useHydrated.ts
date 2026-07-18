"use client";
import { useSyncExternalStore } from "react";

// Store eksternal dummy — nilai tidak pernah berubah setelah mount.
const emptySubscribe = () => () => {};

// Guard hydration untuk state persist (localStorage): server & first client
// render dapat false, setelah hydrate dapat true. Pola resmi React tanpa
// setState di effect.
export function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
