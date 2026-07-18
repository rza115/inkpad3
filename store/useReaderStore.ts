import { create } from "zustand";
import { persist } from "zustand/middleware";

// Fase 8 — preferensi tema reader mode. Satu-satunya store dengan persist
// (localStorage): ini preferensi UI murni milik browser, bukan data Supabase.
// Scope tema cuma di dalam /read — tidak mempengaruhi dashboard/editor/modul lain.

export type ReaderPreset = "light" | "dark" | "sepia" | "custom";
export type ReaderFontId =
  | "merriweather"
  | "lora"
  | "source-sans"
  | "atkinson"
  | "georgia";
export type ReaderScope = "project" | "chapter";

export type ReaderColors = {
  bg: string;
  text: string;
  accent: string;
};

// Nilai preset diturunkan dari design token (ink/parchment/wine/brass) —
// runtime user data via CSS variable, bukan hardcode di komponen.
export const PRESET_COLORS: Record<Exclude<ReaderPreset, "custom">, ReaderColors> = {
  light: { bg: "#ffffff", text: "#1e1b16", accent: "#6b2737" },
  dark: { bg: "#1e1b16", text: "#efe7d8", accent: "#b8934a" },
  sepia: { bg: "#efe7d8", text: "#1e1b16", accent: "#6b2737" },
};

// Font khusus reading — variabel next/font di-load scoped di read/layout.tsx.
// Georgia web-safe, tidak butuh next/font.
export const READER_FONTS: Record<ReaderFontId, { label: string; family: string }> = {
  merriweather: {
    label: "Merriweather (serif)",
    family: "var(--font-merriweather), Georgia, serif",
  },
  lora: { label: "Lora (serif)", family: "var(--font-lora), Georgia, serif" },
  "source-sans": {
    label: "Source Sans 3 (sans)",
    family: "var(--font-source-sans), system-ui, sans-serif",
  },
  atkinson: {
    label: "Atkinson Hyperlegible (sans)",
    family: "var(--font-atkinson), system-ui, sans-serif",
  },
  georgia: { label: "Georgia (serif)", family: "Georgia, 'Times New Roman', serif" },
};

export const DEFAULT_READER_STATE = {
  preset: "sepia" as ReaderPreset,
  customColors: { ...PRESET_COLORS.sepia },
  font: "merriweather" as ReaderFontId,
  lastScope: "project" as ReaderScope,
};

type ReaderState = typeof DEFAULT_READER_STATE & {
  setPreset: (preset: ReaderPreset) => void;
  // Caller (ReaderThemePanel) wajib validasi kontras dulu sebelum commit.
  setCustomColors: (colors: ReaderColors) => void;
  setFont: (font: ReaderFontId) => void;
  setLastScope: (scope: ReaderScope) => void;
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      ...DEFAULT_READER_STATE,
      setPreset: (preset) => set({ preset }),
      setCustomColors: (customColors) => set({ customColors, preset: "custom" }),
      setFont: (font) => set({ font }),
      setLastScope: (lastScope) => set({ lastScope }),
    }),
    {
      name: "inkpad-reader-theme",
      version: 1,
      // Identity migrate — slot disiapkan dari awal untuk perubahan shape ke depan.
      migrate: (persisted) => persisted as ReaderState,
      partialize: (s) => ({
        preset: s.preset,
        customColors: s.customColors,
        font: s.font,
        lastScope: s.lastScope,
      }),
    }
  )
);
