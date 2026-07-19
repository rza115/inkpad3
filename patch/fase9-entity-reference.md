# Fase 9 — Entity Cross-Reference (Hover/Tap Reference ke Characters & Worldbuilding)

> Dokumen ini untuk di-feed ke Claude CLI (Opus) di awal sesi, mengikuti workflow
> dokumentasi-dulu yang sudah berjalan di project ini. Baca seluruh dokumen dulu
> sebelum mulai coding. Kerjakan per Step, stop-and-test tiap Step sebelum lanjut
> ke Step berikutnya — jangan implementasi semua sekaligus.

## 1. Ringkasan Fitur

Saat user mengetik di editor, nama karakter atau istilah worldbuilding yang
sudah terdaftar di project itu otomatis dikenali di dalam teks manuskrip, dan
diberi underline putus-putus tipis. Hover (desktop) atau tap (mobile)
menampilkan popover kecil berisi ringkasan singkat entity tersebut — tanpa
redirect, tanpa mengubah isi dokumen.

**Keputusan desain yang sudah final** (jangan diubah tanpa konfirmasi ulang ke user):

- Semua kemunculan entity di teks ditandai (bukan cuma kemunculan pertama).
- Underline dotted tipis (`slate/45%` default, jadi `wine` saat aktif), **bukan**
  chip/badge/warna solid.
- Trigger: hover mouse di desktop, tap di mobile. Ini satu sistem visual yang
  sama (underline selalu render), cuma beda cara buka popovernya.
- Isi popover: badge kategori kecil + nama + 1–2 kalimat ringkasan saja.
  **Tidak ada** tombol/link "buka detail" yang redirect ke halaman
  Characters/Worldbuilding.
- Deteksi & highlight dihitung on-the-fly dari isi dokumen (ProseMirror
  Decoration), **bukan** disimpan sebagai node/mark permanen di konten. Alasan:
  kalau nama karakter di-rename, semua highlight di semua chapter otomatis
  ikut berubah tanpa migrasi data, dan isi HTML/plain text tetap bersih untuk
  fitur Export (docx/PDF) yang sudah ada.

**Catatan penting soal mobile di dalam Editor** (beda dari Reader Mode):
Editor adalah `contentEditable` — kalau tap-untuk-popover diterapkan sama
seperti tap biasa, itu bisa bentrok sama perilaku normal "tap untuk taruh
cursor" saat user mengedit teks di HP. Untuk **Editor** (`EditorCanvas.tsx`),
pakai **long-press** (≥450ms) sebagai trigger popover di touch device, bukan
tap biasa — tap singkat tetap taruh cursor seperti biasa. Untuk **Reader
Mode** (read-only, tidak ada cursor), tap biasa sudah aman dipakai langsung.
Kalau ini bikin scope kerja Fase 9 kebesaran, boleh skip dulu touch handling
di Editor (desktop-only dulu) dan tandai sebagai TODO — Step 8 di bawah
menjelaskan fallback-nya.

## 2. Perubahan Data Model

Field `aliases` dan `quick_summary` belum ada di `characters` dan
`worldbuilding_entries`. Tambahkan lewat migration baru, ikuti pola file
`patch/fase*.sql` yang sudah ada (jangan bikin ORM migration lain).

**File baru:** `patch/fase9-entity-reference.sql`

```sql
-- Fase 9: entity cross-reference — alias nama & ringkasan pendek untuk popover.
alter table characters
  add column if not exists aliases text[] not null default '{}',
  add column if not exists quick_summary text not null default '';

alter table worldbuilding_entries
  add column if not exists aliases text[] not null default '{}',
  add column if not exists quick_summary text not null default '';
```

Jalankan manual lewat Supabase SQL editor (ikuti kebiasaan project ini —
lihat `patch/PROGRESS.md` buat catat status migration ini).

## 3. Breakdown Implementasi

### Step 1 — Migration
Buat `patch/fase9-entity-reference.sql` seperti di atas. Update
`patch/PROGRESS.md` menandai Fase 9 dimulai.

### Step 2 — Update tipe & actions
`lib/actions/characters.ts`:
- Tambah `aliases: string[]` dan `quick_summary: string` ke type `Character`.
- Update `createCharacter`/`updateCharacter` (apapun nama fungsinya sekarang)
  untuk terima dan simpan dua field ini. `quick_summary` di-trim, batasi
  panjang di form (lihat Step 3), bukan di action.

`lib/actions/worldbuilding.ts`: perlakuan sama untuk `WorldbuildingEntry`.

**Stop-and-test:** pastikan `getCharacters`/`getWorldbuildingEntries` yang
sudah ada tetap jalan normal dengan kolom baru (default kosong).

### Step 3 — Form input
`components/characters/CharacterForm.tsx` dan
`components/worldbuilding/WorldbuildingEntryForm.tsx`:
- Tambah input `aliases` — text input dipisah koma (misal: `Na, Nay`), parse
  jadi array saat submit, trim tiap item, buang yang kosong.
- Tambah textarea `quick_summary`, **maxLength 140 karakter**, tampilkan sisa
  karakter di bawah field (pola UI yang sama kayak field lain di form ini).
  Ini WAJIB pendek karena bakal tampil di popover kecil — jangan biarkan user
  isi paragraf panjang.

Kedua field **opsional** (boleh kosong) — kalau `quick_summary` kosong,
popover nanti fallback tampilkan potongan pertama dari `description`/`content`
(lihat Step 7).

### Step 4 — Entity index & matcher
**File baru:** `lib/editor/entityIndex.ts`

Tanggung jawab file ini: dari daftar characters + worldbuilding entries satu
project, bangun struktur pencarian yang dipakai buat scan teks scene.

```ts
export type EntityRef = {
  id: string;
  type: "character" | "worldbuilding";
  name: string;
  quickSummary: string;
  category?: string; // hanya worldbuilding
};

export type EntityMatch = {
  from: number; // posisi karakter di dalam teks node
  to: number;
  entity: EntityRef;
};

export function buildEntityIndex(
  characters: Character[],
  worldbuilding: WorldbuildingEntry[]
): EntityRef[]

export function findEntityMatches(text: string, index: EntityRef[]): EntityMatch[]
```

Aturan matching (penting, ikuti persis):
- Bangun daftar kandidat: nama utama + semua alias, tiap kandidat nempel ke
  satu `EntityRef`.
- **Case-insensitive** saat mencocokkan, tapi **jangan ubah casing asli** di
  teks (decoration cuma nambah underline, bukan replace text).
- **Word boundary** — jangan match substring di tengah kata lain. Gunakan
  regex dengan boundary yang aman untuk teks Bahasa Indonesia (bukan cuma
  `\b` bawaan JS yang kadang meleset di tanda baca seperti tanda pisah `—`).
- **Longest match wins** — urutkan kandidat dari yang paling panjang duluan,
  supaya "Nayla" tidak ke-match duluan di dalam kata yang lebih panjang kayak
  "Naylawati" (kalaupun ada), dan supaya alias yang jadi substring nama lain
  tidak tumpang tindih aneh.
- Kalau ada dua entity beda tipe punya nama/alias identik persis (jarang tapi
  mungkin), prioritaskan `character` di atas `worldbuilding` — catat ini
  sebagai known limitation di komentar kode, tidak perlu UI resolusi konflik
  di fase ini.

### Step 5 — ProseMirror decoration extension
**File baru:** `components/editor/extensions/entityReference.ts`

Ini Tiptap Extension custom yang nempel ke tiap `SceneEditor` instance di
`EditorCanvas.tsx`. Isinya ProseMirror Plugin yang scan `doc` tiap kali
transaksi berubah, hasilkan `DecorationSet` inline untuk tiap match dari
`findEntityMatches`.

Poin teknis:
- Extension terima `entityIndex: EntityRef[]` lewat `addOptions()`, dan
  storage-nya bisa di-update lewat command (`updateEntityIndex(newIndex)`)
  supaya index bisa di-refresh kalau characters/worldbuilding berubah tanpa
  perlu remount editor.
- Decoration dibuat pakai `Decoration.inline(from, to, { class: "ref",
  "data-entity-id": entity.id, "data-entity-type": entity.type })` — **class
  name harus `ref`**, konsisten sama mockup HTML yang sudah divalidasi user
  (lihat CSS di bawah).
- Hitung ulang `DecorationSet` cuma kalau `doc` berubah (bandingkan lewat
  `tr.docChanged`) — jangan scan ulang tiap keystroke kalau isi tidak
  berubah, dan jangan scan node yang bukan teks biasa (skip kalau ada code
  block di masa depan, walau StarterKit sekarang belum include code block).
- **Jangan** pakai `Decoration.widget` atau custom NodeView untuk popover-nya
  — popovernya di-render terpisah lewat React (Step 7), bukan di dalam
  ProseMirror DOM. Decoration di sini murni buat kasih class+data-attribute
  ke span teks.

### Step 6 — Store
`store/useEditorStore.ts` — tambah state untuk popover yang lagi aktif:

```ts
type ActiveEntityRef = {
  entityId: string;
  entityType: "character" | "worldbuilding";
  rect: DOMRect; // posisi span yang di-hover/tap, buat positioning popover
} | null;
```

Tambah `activeEntityRef` + setter. Juga simpan `entityIndex: EntityRef[]` di
store ini (di-set dari `EditorCanvas` setelah fetch characters+worldbuilding),
supaya popover component (Step 7) bisa ambil data ringkasan tanpa fetch ulang.

### Step 7 — Popover component
**File baru:** `components/editor/EntityRefPopover.tsx`

Satu instance popover di-render sekali di level `EditorCanvas`, posisinya
mengikuti `activeEntityRef.rect` dari store (pakai `position: fixed`, hitung
dari `getBoundingClientRect()` span yang di-hover, taruh di atas span kayak
di mockup, flip ke bawah kalau kepotong viewport atas).

Isi card: badge kategori (`Karakter` / kategori worldbuilding-nya), nama,
`quick_summary` (fallback ke 140 karakter pertama dari `description`/`content`
kalau `quick_summary` kosong — potong di word boundary terdekat, kasih `…`).

Styling ikuti token yang sudah ada di `globals.css` (`bg-ink`, `text-parchment`,
`font-display` untuk nama, `text-brass` untuk badge) — **jangan hardcode hex**,
pakai class Tailwind dari token seperti komponen lain di project ini.

### Step 8 — Wiring
`app/(project)/[projectId]/editor/[chapterId]/page.tsx`:
- Tambah `getCharacters(projectId)` dan `getWorldbuildingEntries(projectId)`
  ke `Promise.all` yang sudah ada, pass sebagai props baru ke `EditorCanvas`.

`components/editor/EditorCanvas.tsx`:
- `useMemo` bangun `entityIndex` dari props characters+worldbuilding, simpan
  ke store (Step 6).
- Pasang extension dari Step 5 ke `useEditor` di `SceneEditor` (tambahkan ke
  array `extensions`, sejajar `StarterKit`).
- Event delegation: satu `onMouseOver`/`onMouseOut`/`onClick` di wrapper div
  canvas (bukan per-span), cek `event.target.closest('.ref')`, ambil
  `data-entity-id`/`data-entity-type`, update `activeEntityRef` di store.
  Ini lebih murah daripada attach listener ke tiap span decoration.
- Render `<EntityRefPopover />` sekali di luar `.map(scenes)`.
- Untuk touch: implementasikan long-press pakai `pointerdown`+`setTimeout`
  (batal kalau `pointerup`/`pointermove` terjadi sebelum 450ms) — **kalau ini
  bikin Step 8 kelamaan**, boleh ship dulu versi desktop-only (skip touch
  handler, catat TODO di komentar), user sudah oke fallback ini.

### Step 9 (opsional, boleh dikerjakan nanti terpisah) — Reader Mode
`ReaderView` render read-only tanpa Tiptap, jadi butuh pendekatan beda: bukan
ProseMirror decoration, tapi wrap string HTML dari `scene.content` dengan
`<span class="ref" data-entity-id="..." data-entity-type="...">` sebelum di-
render (pakai `findEntityMatches` yang sama dari Step 4, tapi terapkan ke HTML
string, hati-hati jangan match di dalam tag HTML itu sendiri — idealnya parse
lewat DOM/regex yang skip di dalam `<...>`). Popovernya bisa reuse
`EntityRefPopover` component yang sama. Karena Reader Mode read-only, tap
biasa (bukan long-press) sudah aman dipakai.

## 4. CSS Reference (sudah divalidasi lewat mockup)

Pastikan class ini konsisten dipakai (via Tailwind arbitrary/utility, bukan
hardcoded CSS baru):

```
.ref            → underline dotted, text-decoration-color slate/45%, cursor-pointer
.ref:hover      → text-decoration-color wine
.ref.open       → (state tap-aktif di mobile) sama seperti :hover
```

Popover card: lebar ±230px, `bg-ink`, `text-parchment`, `rounded-lg`,
`shadow-lg`, badge kecil pakai `bg-brass/15 text-brass font-mono uppercase
text-[10px]`.

## 5. Testing Checklist

- [ ] Rename karakter di halaman Characters → buka chapter yang menyebut nama
      lama, refresh → underline hilang (nama lama sudah tidak match).
      Ketik ulang pakai nama baru → underline muncul otomatis tanpa reload.
- [ ] Satu nama muncul 3x di satu scene → ketiga-tiganya di-underline.
- [ ] Nama entity yang jadi substring kata lain (buat test case sengaja, misal
      alias "Bulan" dan kata biasa "kebulanan" kalau ada) → tidak ke-match
      salah karena word boundary.
- [ ] Hover di desktop → popover muncul di atas kata, hilang saat mouse
      leave.
- [ ] Ketik di scene lain (bukan yang lagi di-hover) → tidak ada flicker atau
      lag kerasa dari decoration recompute.
- [ ] Export ke docx/PDF (fitur yang sudah ada) → pastikan tidak ada residu
      class/attribute `ref` bocor ke output export.
- [ ] `quick_summary` kosong → popover fallback ke potongan `description`/
      `content`, terpotong rapi (tidak motong di tengah kata).
