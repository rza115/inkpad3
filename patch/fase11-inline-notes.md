# Fase 11 — Inline Margin Note

> Feed dokumen ini ke Claude CLI di awal sesi. Kerjakan per Step, stop-and-test
> tiap Step. Mockup visual (desktop & mobile) sudah divalidasi user secara
> terpisah — dokumen ini fokus ke perilaku & data, bukan ulang bahas visual.

## 1. Ringkasan

User select rentang teks di editor → tempel catatan kecil ("cek lagi
timeline", "ganti diksi") yang nempel ke teks itu. Beda dari modul Notes yang
sudah ada (halaman terpisah, catatan lepas) — ini nempel langsung ke rentang
teks tertentu di dalam scene. Satu catatan per rentang, **tidak ada** thread/
reply (beda dari Google Docs comment yang berjenjang).

**Visual (sudah divalidasi lewat mockup):**
- Teks yang ada catatan: tint `brass/18%` (bukan underline dotted — itu punya
  fitur cross-reference/Fase 9, harus tetap beda visual biar tidak ketuker).
- Desktop: marker kecil di kolom margin kanan editor, sejajar baris teks.
  Klik marker → popover kecil di sebelah marker.
- Mobile: tidak ada kolom margin (tidak ada ruang). Marker jadi ikon inline
  kecil nempel di akhir teks yang di-tint. Tap ikon → **bottom sheet** slide
  dari bawah (bukan popover mengambang), isinya kutipan teks asli + isi
  catatan + tombol Hapus/Tutup.
- Bikin catatan baru: select teks → floating toolbar kecil muncul di atas
  seleksi dengan tombol "Tambah catatan" → input singkat → submit.

## 2. ⚠️ Constraint Kritis — Export

Export (`lib/actions/export.ts`, fungsi `generateDocx`/`generatePdf`/
`generateMarkdown`) semuanya strip HTML dengan cara sama:
`scene.content.replace(/<[^>]*>/g, '')` — ini **hanya membuang tag**, isi
teks di dalam tag tetap ikut ke plain text hasil export.

**Konsekuensi:** mark yang dipakai untuk highlight catatan **tidak boleh**
menyisipkan karakter visual apa pun (emoji, ikon Unicode, superscript
character, dst) sebagai *text content* di dalam `scene.content`. Kalau itu
terjadi, karakter itu bakal nyempil di tengah kalimat pas di-export ke
docx/PDF/markdown.

**Aturan wajib:**
- Mark HTML yang disimpan cukup: `<span data-note-id="uuid-di-sini">teks asli
  user, tanpa tambahan apa pun</span>`. Tidak ada child element/text lain di
  dalamnya selain teks asli.
- Semua indikator visual (tint, ikon marker, marker margin) di-render lewat
  **CSS** (class + `::after`/`::before` dengan `content` CSS, bukan konten
  HTML) atau di-render terpisah di layer React (marker di kolom margin/bottom
  sheet itu komponen React sendiri, posisinya dihitung dari
  `getBoundingClientRect()` elemen mark — bukan bagian dari HTML yang
  tersimpan).
- **Test wajib:** setelah implementasi, bikin scene dengan 1+ catatan, export
  ke ketiga format, buka hasilnya, pastikan tidak ada karakter aneh/simbol
  nyempil di teks. Ini bagian dari testing checklist Step 8.

## 3. Data Model

**File baru:** `patch/fase11-inline-notes.sql`

```sql
-- Fase 11: inline margin note — catatan nempel ke rentang teks tertentu
-- di scene, ditandai lewat mark <span data-note-id="..."> di HTML.
create table if not exists inline_notes (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null references scenes(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists inline_notes_scene_id_idx on inline_notes(scene_id);

-- RLS: ikut pola tabel lain di project ini (akses lewat ownership project
-- via scene → chapter → project). Samakan persis dengan policy yang sudah
-- ada di tabel `scenes`/`plot_points`, jangan bikin pola RLS baru.
alter table inline_notes enable row level security;
```

Cek pola RLS existing tabel `scenes` sebelum nulis policy — jangan tebak,
copy pattern yang sudah terbukti jalan.

**File baru:** `lib/actions/inlineNotes.ts` — ikuti persis pola
`lib/actions/plot.ts` atau `lib/actions/notes.ts` yang sudah ada (server
actions, `requireUser()` guard, `revalidatePath`):

```ts
export type InlineNote = {
  id: string;
  scene_id: string;
  content: string;
  created_at: string;
};

export async function getInlineNotes(sceneId: string): Promise<InlineNote[]>
export async function createInlineNote(sceneId: string, content: string): Promise<InlineNote | { error: string }>
export async function deleteInlineNote(id: string): Promise<{ error: string | null }>
// Reconciliation — lihat Step 6
export async function deleteOrphanedInlineNotes(sceneId: string, activeNoteIds: string[]): Promise<void>
```

## 4. Breakdown Implementasi

### Step 1 — Migration
Buat `patch/fase11-inline-notes.sql`, jalankan manual, update
`patch/PROGRESS.md`.

### Step 2 — Server actions
Buat `lib/actions/inlineNotes.ts` sesuai spec di atas.

**Stop-and-test:** test manual lewat Supabase dashboard dulu — insert/delete
row langsung, pastikan RLS tidak blok user yang benar/blok user lain.

### Step 3 — Mark extension (Tiptap)
**File baru:** `components/editor/extensions/inlineNote.ts`

Tiptap `Mark` (bukan Decoration seperti Fase 9 — ini harus persisten karena
isinya manual, bukan computed) dengan:
- Nama mark: `inlineNote`
- Attribute: `noteId: string`
- `renderHTML`: hasilkan `<span data-note-id="${noteId}">` — **tidak ada**
  child/text tambahan (lihat Section 2).
- `parseHTML`: baca balik dari `data-note-id` saat load existing content.
- Tidak perlu `toggleMark` biasa — mark ini dibuat lewat command khusus
  (Step 5) yang juga trigger create row di DB, bukan cuma toggle style.

### Step 4 — Store
`store/useEditorStore.ts` — tambah state untuk note yang lagi aktif/dibuka:

```ts
type ActiveNoteRef = {
  noteId: string;
  content: string;
  quotedText: string; // buat ditampilkan di popover/bottom sheet
  rect: DOMRect;
} | null;
```

Tambah `activeNoteRef` + setter, mirip pola `activeEntityRef` dari Fase 9
(kalau Fase 9 sudah jalan duluan, boleh disatukan jadi satu concept
"activePopoverRef" dengan discriminant `kind: "entity" | "note"" — cek dulu
kondisi codebase saat ini, ambil keputusan paling simpel).

### Step 5 — Bikin catatan baru
Perlu floating selection toolbar (belum ada komponen serupa di codebase ini
sekarang — ini elemen UI baru). **File baru:**
`components/editor/SelectionToolbar.tsx`

- Muncul saat ada text selection non-empty di editor aktif (pakai
  `editor.state.selection` + posisi dari `editor.view.coordsAtPos()`).
  Hilang saat selection kosong/blur.
- Satu tombol "Tambah catatan" → buka input kecil (bisa inline expand di
  toolbar yang sama, atau modal super ringan — pilih yang paling cepat
  diimplementasi, ini bukan area yang perlu didesain ulang berat).
- Submit → `createInlineNote(sceneId, content)` dapat `noteId` baru →
  jalankan command custom di editor yang apply mark `inlineNote` dengan
  attribute `noteId` itu ke rentang selection yang aktif (pakai
  `editor.chain().focus().setMark('inlineNote', { noteId }).run()` atau
  command custom kalau butuh handling khusus).

### Step 6 — Reconciliation saat save
Di `lib/hooks/useDebouncedSave.ts` atau di titik yang sama tempat
`updateSceneContent` dipanggil — setelah save HTML, extract semua
`data-note-id` yang masih ada di HTML final (regex atau DOM parse), lalu
panggil `deleteOrphanedInlineNotes(sceneId, activeNoteIds)` untuk hapus row
`inline_notes` yang mark-nya sudah hilang dari teks (user hapus/edit sampai
markup-nya kebuang). Tidak perlu real-time — cukup jalan bareng autosave yang
sudah ada, jangan bikin mekanisme debounce terpisah.

### Step 7 — Rendering marker + popover/bottom sheet
`components/editor/EditorCanvas.tsx`:
- Event delegation sama seperti Fase 9: `onClick` di wrapper, cek
  `target.closest('[data-note-id]')`, ambil `noteId`, cari data note (dari
  state yang sudah di-load `getInlineNotes` per scene), set `activeNoteRef`.
- Kolom margin kanan: cuma tampil di breakpoint `md:` ke atas (Tailwind),
  hitung posisi marker dari `getBoundingClientRect()` tiap elemen
  `[data-note-id]` per scene.
- Breakpoint mobile (`< md`): marker inline (ikon kecil sesudah tint, murni
  CSS `::after` di class `.noted` atau elemen React kecil yang di-posisikan
  absolute relatif ke span — **bukan** karakter di dalam `scene.content`,
  lihat Section 2). Tap → buka bottom sheet, bukan popover.

**File baru:** `components/editor/NotePopover.tsx` (desktop) dan
`components/editor/NoteBottomSheet.tsx` (mobile) — dua komponen presentasi
terpisah, satu `activeNoteRef` di store, render salah satu berdasarkan
breakpoint (bisa pakai CSS `md:hidden`/`hidden md:block` di dua-duanya
sekaligus render, atau JS media query check — pilih yang paling konsisten
dengan pola breakpoint yang sudah dipakai di `MobileNav.tsx`/`Sidebar.tsx`).

### Step 8 — Testing Checklist

- [ ] Select teks → toolbar muncul → tambah catatan → tint + marker muncul.
- [ ] Klik/tap marker → isi catatan kebuka, tombol Hapus berfungsi (tint
      hilang, row DB kehapus).
- [ ] Ketik/edit teks di sekitar mark → mark ikut pindah mengikuti teks,
      tidak lepas dari rentang aslinya (perilaku native ProseMirror mark).
- [ ] Hapus total teks yang ada mark-nya → setelah autosave jalan, cek row
      `inline_notes` di DB — harus ikut kehapus (reconciliation Step 6).
- [ ] **Export ke docx/PDF/markdown** dengan scene yang punya catatan aktif
      → buka hasil export → pastikan **tidak ada** simbol/karakter aneh
      nyempil di teks (lihat Section 2 — ini yang paling gampang kelewat).
- [ ] Resize browser dari desktop ke mobile width → marker pindah dari kolom
      margin ke inline tanpa layout jebol.
- [ ] Reload halaman dengan scene yang sudah punya catatan → mark, tint, dan
      isi catatan semua muncul kembali dari data tersimpan (bukan cuma
      state React yang hilang saat reload).
