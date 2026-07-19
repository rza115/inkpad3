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
export type ReaderFontSize = "s" | "m" | "l";
export type ReaderLineHeight = "compact" | "normal" | "relaxed";
export type ReaderTextAlign = "left" | "center" | "right" | "justify";

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

// Token ukuran & spasi baris — nilai hidup di store, komponen cuma pasang
// variabel CSS. Skala kecil (3 langkah) sengaja: kontrol nyaman tanpa slider.
export const READER_FONT_SIZES: Record<ReaderFontSize, { label: string; value: string }> = {
  s: { label: "S", value: "0.9375rem" },
  m: { label: "M", value: "1.0625rem" },
  l: { label: "L", value: "1.1875rem" },
};

export const READER_LINE_HEIGHTS: Record<ReaderLineHeight, { label: string; value: string }> = {
  compact: { label: "Rapat", value: "1.5" },
  normal: { label: "Normal", value: "1.7" },
  relaxed: { label: "Lega", value: "1.9" },
};

// Perataan paragraf — scoped Reader Mode saja, tidak menyentuh Editor.
// "Tengah"/"Kanan" kurang lazim untuk body paragraf panjang (readability),
// lebih relevan buat kutipan pendek/puisi/gaya eksperimental — tetap
// disediakan tanpa dibatasi, user yang tentukan sendiri per project.
export const READER_TEXT_ALIGNS: Record<ReaderTextAlign, { label: string }> = {
  left: { label: "Kiri" },
  center: { label: "Tengah" },
  right: { label: "Kanan" },
  justify: { label: "Rata Kanan-Kiri" },
};

export const DEFAULT_READER_STATE = {
  preset: "sepia" as ReaderPreset,
  customColors: { ...PRESET_COLORS.sepia },
  font: "merriweather" as ReaderFontId,
  fontSize: "m" as ReaderFontSize,
  lineHeight: "normal" as ReaderLineHeight,
  // Default kiri: perilaku existing user tidak berubah pas fitur ini rilis.
  textAlign: "left" as ReaderTextAlign,
  lastScope: "project" as ReaderScope,
  lastReadProjectId: null as string | null,
  lastReadChapterId: null as string | null,
};

type ReaderState = typeof DEFAULT_READER_STATE & {
  setPreset: (preset: ReaderPreset) => void;
  // Caller (ReaderThemePanel) wajib validasi kontras dulu sebelum commit.
  setCustomColors: (colors: ReaderColors) => void;
  setFont: (font: ReaderFontId) => void;
  setFontSize: (fontSize: ReaderFontSize) => void;
  setLineHeight: (lineHeight: ReaderLineHeight) => void;
  setTextAlign: (textAlign: ReaderTextAlign) => void;
  // Atomik: scope + identitas chapter terakhir dalam satu set, supaya tidak
  // ada state antara (scope chapter tapi chapterId basi).
  setLastRead: (
    scope: ReaderScope,
    projectId: string | null,
    chapterId: string | null
  ) => void;
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      ...DEFAULT_READER_STATE,
      setPreset: (preset) => set({ preset }),
      setCustomColors: (customColors) => set({ customColors, preset: "custom" }),
      setFont: (font) => set({ font }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setTextAlign: (textAlign) => set({ textAlign }),
      setLastRead: (scope, projectId, chapterId) =>
        set({
          lastScope: scope,
          lastReadProjectId: projectId,
          lastReadChapterId: chapterId,
        }),
    }),
    {
      name: "inkpad-reader-theme",
      version: 3,
      // v1 → v2: blob lama tidak punya fontSize/lineHeight/lastRead*;
      // v2 → v3: tambah textAlign — sama-sama isi dari default, preferensi
      // lama tetap utuh.
      migrate: (persisted, version) =>
        version < 3
          ? { ...DEFAULT_READER_STATE, ...(persisted as object) }
          : (persisted as ReaderState),
      partialize: (s) => ({
        preset: s.preset,
        customColors: s.customColors,
        font: s.font,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        textAlign: s.textAlign,
        lastScope: s.lastScope,
        lastReadProjectId: s.lastReadProjectId,
        lastReadChapterId: s.lastReadChapterId,
      }),
    }
  )
);
