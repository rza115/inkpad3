# Fase 10 — Perataan Teks (Text Alignment) di Reader Mode

> Feed dokumen ini ke Claude CLI di awal sesi. Scope-nya kecil (1 field
> preferensi baru, pola persis sama seperti `fontSize`/`lineHeight` yang
> sudah ada), harusnya selesai dalam satu jalan tanpa perlu dipecah banyak
> step. Tetap stop-and-test setelah selesai.

## 1. Ringkasan

Tambah kontrol perataan paragraf di `ReaderThemePanel.tsx`: **Kiri, Tengah,
Kanan, Rata kanan-kiri (justify)**. Preferensi ini scoped ke Reader Mode saja
(sama seperti font/fontSize/lineHeight sekarang) — **tidak** mempengaruhi
Editor. Default tetap **Kiri**, supaya perilaku existing user tidak berubah
begitu fitur ini di-deploy.

Catatan kecil buat komentar kode (bukan pembatasan UI): "Tengah" dan "Kanan"
kurang lazim dipakai untuk body paragraf panjang (readability), lebih relevan
untuk kutipan pendek/puisi/gaya penulisan eksperimental. Karena beberapa
series kamu (misal narator non-manusia) kadang eksperimen format teks, tetap
sediakan keempatnya tanpa dibatasi — user yang tentukan sendiri per project.

## 2. Perubahan

Ikuti persis pola `fontSize`/`lineHeight` yang sudah ada di
`store/useReaderStore.ts` — field baru ini simetris, bukan konsep baru.

### `store/useReaderStore.ts`

```ts
export type ReaderTextAlign = "left" | "center" | "right" | "justify";

export const READER_TEXT_ALIGNS: Record<ReaderTextAlign, { label: string }> = {
  left: { label: "Kiri" },
  center: { label: "Tengah" },
  right: { label: "Kanan" },
  justify: { label: "Rata Kanan-Kiri" },
};
```

- Tambah `textAlign: "left" as ReaderTextAlign` ke `DEFAULT_READER_STATE`.
- Tambah `setTextAlign: (textAlign: ReaderTextAlign) => void` ke type
  `ReaderState` dan implementasinya di `create()`.
- Tambah `textAlign: s.textAlign` ke `partialize`.
- **Bump `version` persist dari 2 ke 3**, tambah migrate case: `version < 3`
  → `{ ...DEFAULT_READER_STATE, ...(persisted as object) }` (pola yang sama
  persis kayak migrate v1→v2 yang sudah ada, cuma tambah satu kondisi).

### `app/globals.css`

Di bagian `.reader-theme .prose-inkpad` yang sudah ada (dekat aturan
`font-size: var(--reader-size)` dan `line-height: var(--reader-leading)`),
tambah:

```css
.reader-theme .prose-inkpad p {
  text-align: var(--reader-align);
}
```

Taruh di selector yang sama dengan aturan `line-height` yang sudah ada kalau
bisa digabung (keduanya target `p`), jangan bikin blok terpisah baru kalau
tidak perlu.

### `components/reader/ReaderView.tsx`

Di object `style` yang sudah set `--reader-bg`, `--reader-font`,
`--reader-size`, `--reader-leading`, dst — tambah satu baris:

```ts
"--reader-align": textAlign,
```

(`textAlign` diambil dari `store` yang sudah di-destructure di komponen ini,
sama seperti `font`/`fontSize`/`lineHeight` sekarang.)

### `components/reader/ReaderThemePanel.tsx`

Tambah satu blok baru **persis meniru pola** blok "Ukuran teks"/"Spasi baris"
yang sudah ada (segmented button, `role="group"`, `aria-pressed`,
`aria-labelledby`) — taruh setelah blok "Spasi baris", sebelum penutup panel:

```tsx
<div className="mt-3 flex flex-col gap-1 text-sm">
  <span id="reader-text-align-label">Perataan teks</span>
  <div
    role="group"
    aria-labelledby="reader-text-align-label"
    className="flex gap-2"
  >
    {(Object.keys(READER_TEXT_ALIGNS) as ReaderTextAlign[]).map((a) => (
      <button
        key={a}
        type="button"
        onClick={() => setTextAlign(a)}
        aria-pressed={textAlign === a}
        className={`flex-1 rounded border px-2 py-1.5 text-xs focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--reader-accent)] ${
          textAlign === a
            ? "border-[var(--reader-accent)] font-semibold"
            : "[border-color:color-mix(in_srgb,var(--reader-text)_20%,transparent)] hover:opacity-70"
        }`}
      >
        {READER_TEXT_ALIGNS[a].label}
      </button>
    ))}
  </div>
</div>
```

4 label dalam satu baris (`flex gap-2`) mungkin sempit di panel lebar `w-72`
yang sekarang — kalau kepotong/wrap jelek pas ditest, ganti jadi grid 2×2
(`grid grid-cols-2 gap-2`) alih-alih flex satu baris. Cek visual dulu sebelum
mutusin.

Jangan lupa destructure `textAlign` dan `setTextAlign` dari `useReaderStore()`
di baris atas komponen, sejajar field lain yang sudah di-destructure.

## 3. Testing Checklist

- [ ] Ganti ke tiap 4 opsi → paragraf di `/read` langsung berubah rata tanpa
      reload (live preview, sama seperti ganti font/ukuran sekarang).
- [ ] Reload halaman → preferensi alignment tetap tersimpan (persist jalan).
- [ ] User lama yang localStorage-nya masih versi 2 (belum punya
      `textAlign`) → tidak error, otomatis fallback ke default `"left"`.
- [ ] Alignment cuma pengaruh ke Reader Mode — buka Editor, pastikan tidak
      ada perubahan apa pun di sana.
- [ ] Cek preset "Tengah" dan "Kanan" dengan paragraf panjang — pastikan
      tidak ada elemen lain (misal separator `⁂` antar-scene) yang ikut
      kegeser dari posisi tengahnya secara tidak sengaja.
