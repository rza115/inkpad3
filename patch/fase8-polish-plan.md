# Polish Reader Mode (Fase 8)

## Context

Fase 8 selesai dan sudah dites user. Polish yang disepakati (4 item, semua dipilih user):

1. **Navigasi baca** — keyboard ←/→ prev/next chapter, link "Bab berikutnya" di akhir konten, pemisah scene (⁂).
2. **Kontrol tipografi** — ukuran font (S/M/L) + spasi baris (Rapat/Normal/Lega) di ReaderThemePanel, persist.
3. **UX panel tema** — Escape & klik-di-luar untuk nutup, focus management.
4. **Manfaatkan lastScope** — link "Baca" di Sidebar/MobileNav resume ke chapter terakhir dibaca. Saat ini `lastScope` ditulis tapi tidak pernah dibaca.

Bukan rewrite — semua nempel ke pola yang sudah ada (CSS variables, Zustand persist, pola Escape dari `ImageLightbox`).

## Perubahan per file

### 1. `store/useReaderStore.ts` — shape v2 + migrate

- Tipe & token baru (nilai hidup di store, bukan hardcode di komponen):
  - `ReaderFontSize = "s" | "m" | "l"` → `READER_FONT_SIZES` (label + value: `0.9375rem` / `1.0625rem` / `1.1875rem`, default `m`)
  - `ReaderLineHeight = "compact" | "normal" | "relaxed"` → `READER_LINE_HEIGHTS` (label Rapat/Normal/Lega, value `1.5` / `1.7` / `1.9`, default `normal`)
- `DEFAULT_READER_STATE` tambah: `fontSize: "m"`, `lineHeight: "normal"`, `lastReadProjectId: null`, `lastReadChapterId: null`.
- Actions: tambah `setFontSize`, `setLineHeight`; **ganti** `setLastScope` dengan satu action atomik:
  ```ts
  setLastRead: (scope, projectId, chapterId) =>
    set({ lastScope: scope, lastReadProjectId: projectId, lastReadChapterId: chapterId })
  ```
- Persist: `version: 2`, migrate nyata (slot identity yang disiapkan dari awal kini terpakai):
  ```ts
  migrate: (persisted, version) =>
    version < 2 ? { ...DEFAULT_READER_STATE, ...(persisted as object) } : persisted
  ```
- `partialize` tambah 4 field baru.

### 2. Baru: `lib/hooks/useHydrated.ts`

Ekstrak pola `useSyncExternalStore(emptySubscribe, () => true, () => false)` dari `ReaderView` — dipakai juga oleh `useReadHref` (Sidebar butuh guard hydration yang sama). Letak di sebelah `useDebouncedSave.ts`.

```ts
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
```

### 3. Baru: `lib/hooks/useReadHref.ts`

```ts
export function useReadHref(projectId: string): string
```
Kalau `hydrated && lastScope === "chapter" && lastReadProjectId === projectId && lastReadChapterId` → `/{projectId}/read/{chapterId}`, selain itu `/{projectId}/read`. Selector per-field supaya Sidebar tidak re-render saat tema berubah. Hydration-safe: server & first client render sama-sama dapat href dasar, upgrade setelah hydrate.

### 4. `components/reader/ReaderView.tsx`

- Pakai `useHydrated()`, hapus inline `emptySubscribe`/`useSyncExternalStore`.
- Ganti effect `setLastScope` → `setLastRead(scope, projectId, scope === "chapter" ? currentChapterId ?? null : null)`. Kunjungan ke scope project me-null-kan chapter → jalur self-heal untuk link basi.
- **Hoist** komputasi `index/prev/next` dari ReaderToolbar ke sini (dipakai 3 tempat: toolbar, keyboard nav, footer). Pass `prev`/`next`/`current`/`chapterCount` sebagai props ke toolbar.
- Inline style root tambah `--reader-size` + `--reader-leading` dari token store.
- **Keyboard nav** effect (scope chapter saja, mati saat `themePanelOpen`):
  ```tsx
  useEffect(() => {
    if (scope !== "chapter" || themePanelOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.key === "ArrowLeft" && prev) router.push(`/${projectId}/read/${prev.id}`);
      if (e.key === "ArrowRight" && next) router.push(`/${projectId}/read/${next.id}`);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [scope, themePanelOpen, prev?.id, next?.id, projectId, router]);
  ```
- **Pemisah scene**: antar scene (`i > 0`) render `<div aria-hidden className="my-10 text-center text-lg tracking-[0.5em] opacity-40 select-none">⁂</div>` via `Fragment` (key di Fragment).
- **Footer akhir konten** (scope chapter): kalau ada `next` → `Link` "Bab berikutnya: {title} →"; kalau bab terakhir → "— Tamat bab terakhir —" + link "Baca seluruh project". Styling ikut variabel tema (`--reader-accent`, border `color-mix(in_srgb,var(--reader-text)_15%,transparent)`), `fontFamily: var(--font-sans)`.

### 5. `components/reader/ReaderToolbar.tsx`

- Terima `prev`/`next`/`current`/`chapterCount` sebagai props (hapus komputasi lokal) — render identik.
- Tombol Tema dapat atribut `data-theme-trigger` (dipakai handler klik-luar panel supaya tidak close-lalu-reopen).

### 6. `components/reader/ReaderThemePanel.tsx`

- **Tipografi**: dua baris segmented button (Ukuran teks S/M/L, Spasi baris Rapat/Normal/Lega) di bawah select Font, gaya sama seperti tombol preset, `aria-pressed` untuk state aktif.
- **UX**: panel non-modal (sengaja tanpa backdrop — user harus bisa lihat teks berubah live). Effect:
  ```tsx
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus(); // root panel dapat tabIndex={-1}
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (panelRef.current?.contains(t) || t.closest("[data-theme-trigger]")) return;
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      triggerRef.current?.focus(); // focus balik ke tombol Tema
    };
  }, [onClose]);
  ```
- Arrow keys tidak bentrok dengan nav: guard `themePanelOpen` di ReaderView.

### 7. `components/layout/Sidebar.tsx` + `MobileNav.tsx`

Satu baris tiap file: `const readHref = useReadHref(projectId)`, lalu `href={item.segment === "read" ? readHref : `/${projectId}/${item.segment}`}`. `SidebarNavItem` tidak berubah (route `/read` di route group `(reader)` tanpa sidebar, jadi active-state tidak pernah kena).

### 8. `app/(reader)/[projectId]/read/[chapterId]/page.tsx` — mitigasi link mati

Pisahkan dua kondisi yang sekarang digabung (`!data || data.chapters.length === 0` → `notFound()`):
```ts
if (!data) notFound();                       // project tidak ada
if (data.chapters.length === 0) redirect(`/${projectId}/read`); // chapter dihapus → fallback scope project
```
Landing di scope project → `setLastRead` menulis ulang store → link sidebar sembuh permanen.

### 9. `app/globals.css`

Append ke blok `.reader-theme` (komentar rationale gaya sama):
```css
/* Ukuran & spasi baris pilihan user — variabel di-set inline oleh ReaderView. */
.reader-theme .prose-inkpad { font-size: var(--reader-size); }
.reader-theme .prose-inkpad p,
.reader-theme .prose-inkpad li { line-height: var(--reader-leading); }
```
Specificity `0,2,1` menang bersih atas `leading-relaxed` (`0,1,1`) tanpa `!important`; heading tetap ukuran tetap (kontrol = kenyamanan body text); scoped `.reader-theme` → tidak bocor ke editor.

## Urutan implementasi

1. Store v2 + migrate → 2. `useHydrated` + refactor ReaderView (pure refactor) → 3. ReaderView (hoist, CSS vars, separator, footer, keyboard) + ReaderToolbar → 4. ReaderThemePanel → 5. `useReadHref` + Sidebar/MobileNav → 6. redirect chapter page → 7. globals.css.

## Edge cases

| Kasus | Perilaku |
|---|---|
| Bab terakhir, ArrowRight / bab pertama, ArrowLeft | No-op (guard `next`/`prev` null) |
| Bab terakhir, akhir artikel | "— Tamat bab terakhir —" + link "Baca seluruh project" |
| Scope project | Tanpa keyboard nav & footer nav (guard scope) |
| Panel tema terbuka + panah | Effect nav unbind via `themePanelOpen`; cek fokus-input lapis kedua |
| Klik Tema saat panel terbuka | Eksklusi `data-theme-trigger` cegah close-lalu-reopen |
| Chapter tersimpan sudah dihapus | Server redirect ke `/read`; store self-heal saat landing |
| `lastReadProjectId` ≠ project sekarang | Guard equality di `useReadHref` → href dasar `/read` |
| Blob localStorage v1 lama | migrate isi 4 field baru dengan default, preferensi tema lama utuh |
| Href sidebar saat SSR | Guard `useHydrated` → href dasar di server + first client render, upgrade setelahnya |
| Chapter 1 scene / 0 scene | Pemisah hanya render di `i > 0`; empty-state lama tak berubah |

## Verifikasi

- `npx tsc --noEmit` + `npx eslint app components store lib` bersih; `npx next build` sukses.
- Manual via dev server:
  - Scope chapter: ←/→ pindah bab; di bab pertama/terakhir no-op; panah tidak jalan saat panel tema terbuka atau fokus di input.
  - Akhir konten: link "Bab berikutnya" jalan; bab terakhir tampil "Tamat" + link baca semua.
  - Pemisah ⁂ muncul hanya antar scene (chapter 1 scene → tanpa pemisah).
  - Panel tema: Escape & klik luar nutup; klik tombol Tema saat panel terbuka → toggle bersih (tanpa flicker); focus balik ke tombol Tema.
  - Ukuran/spasi: ganti S/M/L & Rapat/Lega terlihat di konten, persist setelah refresh; localStorage v1 lama termigrasi tanpa kehilangan preferensi warna/font (tes: edit devtools `inkpad-reader-theme` versi 1).
  - Resume: buka `/read/{chapter}` → balik ke outline → link "Baca" di sidebar menuju chapter itu; buka `/read` (project) → link balik ke `/read`. Hapus chapter yang tersimpan → link redirect ke `/read` tanpa 404.
  - Tema editor/dashboard tidak berubah (scoping aman).
