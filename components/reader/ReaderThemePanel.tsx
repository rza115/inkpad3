"use client";

import { useState } from "react";
import {
  useReaderStore,
  PRESET_COLORS,
  READER_FONTS,
  type ReaderColors,
  type ReaderFontId,
  type ReaderPreset,
} from "@/store/useReaderStore";

// --- Contrast guard (WCAG relative luminance) ---------------------------------
// Helper lokal panel — validasi kontras sebelum commit warna custom ke store,
// mencegah kombinasi teks yang tidak terbaca ikut ke-persist.

function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(value.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const MIN_TEXT_CONTRAST = 4.5; // WCAG AA body text — di bawah ini diblok
const MIN_ACCENT_CONTRAST = 3; // aksen bukan body text — cuma warning

// --- Panel --------------------------------------------------------------------

const PRESET_LABELS: Record<Exclude<ReaderPreset, "custom">, string> = {
  light: "Terang",
  dark: "Gelap",
  sepia: "Sepia",
};

const COLOR_FIELDS: { key: keyof ReaderColors; label: string }[] = [
  { key: "bg", label: "Latar" },
  { key: "text", label: "Teks" },
  { key: "accent", label: "Aksen" },
];

type ReaderThemePanelProps = {
  onClose: () => void;
};

export function ReaderThemePanel({ onClose }: ReaderThemePanelProps) {
  const { preset, customColors, font, setPreset, setCustomColors, setFont } =
    useReaderStore();
  const [warning, setWarning] = useState<string | null>(null);

  // Nilai efektif yang lagi tampil (buat isi color input)
  const effectiveColors =
    preset === "custom" ? customColors : PRESET_COLORS[preset];

  const handleColorChange = (key: keyof ReaderColors, value: string) => {
    const pending: ReaderColors = { ...effectiveColors, [key]: value };
    const textRatio = contrastRatio(pending.bg, pending.text);

    if (textRatio < MIN_TEXT_CONTRAST) {
      // Blok: jangan commit ke store, kasih tahu kenapa
      setWarning(
        `Kontras warna terlalu rendah (${textRatio.toFixed(1)} : 1, minimal 4.5 : 1) — teks bakal susah dibaca. Warna tidak disimpan.`
      );
      return;
    }

    const accentRatio = contrastRatio(pending.bg, pending.accent);
    setWarning(
      accentRatio < MIN_ACCENT_CONTRAST
        ? `Kontras aksen rendah (${accentRatio.toFixed(1)} : 1) — elemen aksen bisa kurang kelihatan.`
        : null
    );
    setCustomColors(pending); // otomatis set preset = "custom"
  };

  const handlePreset = (p: Exclude<ReaderPreset, "custom">) => {
    setPreset(p);
    setWarning(null);
  };

  const fieldClass =
    "flex items-center justify-between gap-3 text-sm";

  return (
    <div
      className="fixed top-12 right-4 z-50 w-72 rounded-lg border bg-[var(--reader-bg)] p-4 text-[var(--reader-text)] shadow-lg [border-color:color-mix(in_srgb,var(--reader-text)_20%,transparent)]"
      style={{ fontFamily: "var(--font-sans)" }}
      role="dialog"
      aria-label="Pengaturan tema reader"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tema Reader</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup panel tema"
          className="rounded px-1.5 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--reader-accent)]"
        >
          ✕
        </button>
      </div>

      {/* Preset */}
      <div className="mb-4 flex gap-2">
        {(Object.keys(PRESET_LABELS) as Exclude<ReaderPreset, "custom">[]).map(
          (p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePreset(p)}
              className={`flex-1 rounded border px-2 py-1.5 text-xs focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--reader-accent)] ${
                preset === p
                  ? "border-[var(--reader-accent)] font-semibold"
                  : "[border-color:color-mix(in_srgb,var(--reader-text)_20%,transparent)] hover:opacity-70"
              }`}
              style={{
                backgroundColor: PRESET_COLORS[p].bg,
                color: PRESET_COLORS[p].text,
              }}
            >
              {PRESET_LABELS[p]}
            </button>
          )
        )}
      </div>

      {/* Warna custom */}
      <div className="mb-4 flex flex-col gap-2">
        {COLOR_FIELDS.map(({ key, label }) => (
          <label key={key} className={fieldClass}>
            <span>{label}</span>
            <input
              type="color"
              value={effectiveColors[key]}
              onChange={(e) => handleColorChange(key, e.target.value)}
              className="h-8 w-14 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label={`Warna ${label.toLowerCase()}`}
            />
          </label>
        ))}
      </div>

      {warning && (
        <p className="mb-3 rounded border border-[var(--reader-accent)] px-2 py-1.5 text-xs">
          {warning}
        </p>
      )}

      {/* Font */}
      <label className="flex flex-col gap-1 text-sm">
        <span>Font</span>
        <select
          value={font}
          onChange={(e) => setFont(e.target.value as ReaderFontId)}
          className="rounded border bg-[var(--reader-bg)] px-2 py-1.5 text-sm text-[var(--reader-text)] [border-color:color-mix(in_srgb,var(--reader-text)_20%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--reader-accent)]"
        >
          {(Object.keys(READER_FONTS) as ReaderFontId[]).map((id) => (
            <option key={id} value={id}>
              {READER_FONTS[id].label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
