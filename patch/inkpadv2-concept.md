# InkpadV2 — Fresh Build Concept & Instructions

> **v1.1 — Addendum Anti-Ambiguitas ditambahkan.** Lihat section paling bawah
> ("Aturan Tambahan — Anti-Ambiguitas") sebelum mulai Fase 0. Kalau ada bagian
> di atas yang kelihatan kontradiktif sama addendum, **addendum yang menang.**

## Konteks
- Project baru, repo baru, dibangun dari nol (bukan lanjutan/refactor dari kode lama).
- Stack: **React via Next.js**, TypeScript, deploy di **Vercel**.
- Styling: **Tailwind CSS sejak awal**.
- Database: **Supabase full-time sejak awal — TIDAK ada local/offline storage.** Versi sebelumnya pakai local state/offline storage dan itu bikin konflik pas gagal update cache. Jadi di project ini, semua read/write data harus langsung ke Supabase, no local cache layer yang bisa out-of-sync.
- Alasan mulai dari nol: versi sebelumnya sempat migrasi CSS biasa → Tailwind yang bikin banyak bug layout. Supaya tidak terulang, project ini distruktur clean dari hari pertama.
- Tujuan akhir: **full writing suite** untuk menulis novel — editor, outline, notes, character, plot, worldbuilding, illustration, dan export.

## Prinsip Utama (WAJIB dipatuhi Claude Code sejak commit pertama)
1. **Tailwind only, no custom CSS kecuali reset minimal di `globals.css`.**
2. **Setup `tailwind.config.ts` dengan design tokens (warna, spacing, font, breakpoints) di awal.**
3. **Bangun layout shell dulu (root layout, sidebar, topbar, content area) dan stabilkan di 3 breakpoint sebelum nulis fitur apapun.**
4. **Satu pendekatan layout per section** — jangan campur `flex` dan `grid` tanpa alasan di area yang sama.
5. **Strict TypeScript** (`strict: true`) sejak awal.
6. **Supabase sebagai satu-satunya sumber data — no local/offline storage, no manual cache layer.** Semua state di komponen bersifat derived dari data yang di-fetch/disubscribe langsung dari Supabase (misalnya via server components / React Query dengan Supabase sebagai source of truth, bukan cache lokal yang bisa stale). Zustand boleh dipakai, tapi cuma buat UI state (lihat Tech Stack) — bukan buat nyimpen salinan data Supabase.
7. Struktur folder rapi sejak commit pertama.
8. **Soft-delete, bukan hard-delete, untuk semua entitas utama** (project, chapter, scene, note, character, plot point, worldbuilding entry). Delete = set `deleted_at`, bukan `DELETE FROM`. Alasan: karena tidak ada local cache/undo buffer (prinsip #6), hard-delete langsung permanen dan berisiko tinggi kalau kepencet gak sengaja.

## Tech Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- **Supabase** (Postgres + Auth + Realtime) sebagai backend & database utama
- Data fetching: server components / server actions untuk baca-tulis langsung ke Supabase (hindari state management terpisah yang menyimpan salinan data secara offline)
- **Zustand** untuk UI state lokal (modal terbuka/tertutup, sidebar collapsed, item yang lagi diselect, draft state di editor sebelum ter-save) — **BUKAN** untuk cache/copy data Supabase (chapters, notes, characters, dll tetap harus fetch/subscribe langsung dari Supabase, jangan disimpan duplikat di Zustand store)
- Deploy: Vercel

## Design & Layout Guidelines

Ini arahan visual biar Claude Code gak nebak/pakai default template sendiri (salah satu sumber bug layout sebelumnya). Semua token di bawah WAJIB didefinisikan di `tailwind.config.ts` sebelum komponen apapun dibuat.

**Arah visual:** nuansa "meja kerja penulis / manuscript" — bukan tema SaaS generik, bukan juga tema cream+terracotta atau dark+neon yang udah terlalu umum di produk AI-generated.

**Warna (named tokens):**
- `ink` `#1E1B16` — surface gelap utama (sidebar, topbar)
- `parchment` `#EFE7D8` — canvas terang khusus area menulis (editor), beda dari cream generik, lebih hangat/kekuningan
- `wine` `#6B2737` — accent utama (CTA, active state, link)
- `slate` `#4A5568` — teks sekunder, border, elemen non-aktif
- `brass` `#B8934A` — highlight/status marker (badge status chapter, tag)

**Tipografi:**
- Display/heading (judul chapter, project title): serif berkarakter (misal Fraunces/Lora) — dipakai terbatas, cuma di judul.
- Body/UI: sans humanis (misal Inter/Source Sans) untuk semua teks interface & isi editor.
- Utility (word count, timestamp, metadata): monospace (misal JetBrains Mono) — kesan mesin tik, cocok buat metadata manuscript.

**Layout:**
- Dashboard: grid kartu project ("rak buku"), bukan tabel/list generik.
- Shell utama (setelah login): sidebar kiri (navigasi project tree: chapters/characters/plot/dll) + canvas kanan.
- Editor: canvas `parchment` di tengah dengan margin kiri-kanan lebar (kesan halaman manuskrip), bukan full-bleed edge-to-edge.

**Signature element (satu elemen yang jadi ciri khas, jangan lebih):** indikator "ribbon/bookmark" di nav item yang lagi aktif dan di status chapter — elemen kecil yang berulang, bukan dekorasi random di banyak tempat.

**Aturan wajib:** responsive sampai mobile, focus state kelihatan jelas buat keyboard nav, animasi seperlunya aja (jangan banyak micro-animation tanpa alasan).


```
/app
  /layout.tsx        <- root layout, shell + font + globals.css
  /login             <- halaman login/register (Supabase Auth)
  /(dashboard)
    /page.tsx        <- dashboard: grid project milik user
  /editor
  /outline
  /notes
  /characters
  /plot
  /worldbuilding
  /illustration
  /export
/components
  /layout            <- Sidebar, Topbar, Shell (dibangun & distabilkan duluan)
  /ui                <- primitives: Button, Modal, Input, dll
  /editor
  /outline
  /notes
  /characters
  /plot
  /worldbuilding
  /illustration
/lib
  /supabase          <- client & server Supabase client setup
  /types.ts          <- data model: Project, Chapter, Scene
/styles/globals.css  <- Tailwind directives + reset minimal
tailwind.config.ts
tsconfig.json (strict: true)
```

## Data Model Awal (Supabase Tables)
- **Auth**: pakai Supabase Auth bawaan (email/password atau magic link) — tidak bikin tabel user manual.
- `projects` (id, user_id, title, created_at, deleted_at?, ...) — `user_id` merujuk ke `auth.users`, dipakai buat filter project per user (RLS wajib aktif: user cuma bisa akses project miliknya sendiri).
- `chapters` (id, project_id, title, order, status, deleted_at?, ...)
- `scenes` (id, chapter_id, content, order, deleted_at?, ...)
- `notes` (id, project_id, title, content, linked_chapter_id?, deleted_at?, ...)
- `characters` (id, project_id, name, description, role, arc_notes, deleted_at?, ...)
- `plot_points` (id, project_id, title, description, order, linked_chapter_id?, status, deleted_at?, ...)
- `worldbuilding_entries` (id, project_id, category, title, content, deleted_at?, ...) — category misal: lokasi, faksi, sistem/lore, dll
- `illustrations` (id, project_id, title, image_path, linked_character_id?, linked_scene_id?, linked_worldbuilding_id?, deleted_at?, ...) — `image_path` merujuk ke file di **Supabase Storage** (bukan disimpan sebagai base64/local file)
- `chapter_versions` (id, chapter_id, content_snapshot, created_at, ...) — snapshot berkala isi chapter, buat rollback
- `scene_versions` (id, scene_id, content_snapshot, created_at, ...) — snapshot berkala isi scene, buat rollback
- `character_relationships` (id, project_id, character_id, related_character_id, relationship_type, notes?, ...) — relationship_type misal: keluarga, rival, mentor, pasangan, dll (bebas/custom label)

Semua tabel diakses langsung lewat Supabase client (server-side lewat server actions/route handlers), bukan disimpan ulang di local storage/IndexedDB. File gambar upload lewat **Supabase Storage bucket**, bukan disimpan di filesystem lokal/public folder Next.js. Semua query default filter `deleted_at IS NULL` kecuali di halaman Trash.

## Fitur (Full Writing Suite) — dibangun setelah shell & Supabase setup stabil

### 1. Editor
- Rich text / markdown editor untuk nulis chapter.
- Save langsung ke Supabase (debounced write on change, bukan local-first).
- Word count & reading time.
- **Save status indicator** (saved/saving/failed) yang jelas kelihatan — karena no local-first, user harus tahu kalau ada write yang gagal (misal koneksi putus), bukan diam-diam kehilangan tulisan. Failed save wajib bisa retry.
- **Version history**: snapshot berkala (misal tiap interval waktu tertentu atau tiap save signifikan) ke `chapter_versions`/`scene_versions`, bisa lihat riwayat & rollback ke versi sebelumnya.

### 2. Outline
- Hierarki Project → Chapter → Scene, data dari Supabase.
- Drag-and-drop reorder (update `order` field langsung ke DB).
- Status per chapter (draft/revisi/selesai).

### 3. Notes
- Catatan bebas, tersimpan di tabel `notes`.
- Opsional: link ke chapter tertentu.

### 4. Character
- Profil karakter: nama, deskripsi, role (protagonist/antagonist/side), arc notes.
- List/grid view semua karakter per project, detail view per karakter.
- **Relationship map**: hubungan antar karakter (rival, keluarga, mentor, pasangan, dll — label bebas), disimpan di `character_relationships`, ditampilkan minimal sebagai list relasi di detail karakter (visual graph opsional, fase belakangan).

### 5. Plot
- Daftar plot point/beat, bisa di-link ke chapter tertentu.
- Status per plot point (planned/in progress/resolved), reorder.

### 6. Worldbuilding
- Entry bebas per kategori (lokasi, faksi, sistem/lore, dll).
- Bisa cross-reference ke karakter/chapter (opsional, fase belakangan).

### 7. Illustration
- Upload gambar (portrait karakter, scene, peta/worldbuilding) ke Supabase Storage.
- Gallery view per project, bisa di-link ke karakter/scene/worldbuilding entry tertentu.
- Preview/lightbox untuk lihat gambar full-size.

### 8. Export
- Export ke `.docx` / `.pdf` / `.md`, generate dari data yang diambil langsung dari Supabase saat export di-trigger.
- Per chapter, per modul (character/plot/worldbuilding), atau seluruh project.
- Opsional: sertakan illustration yang ter-link saat export (misal cover atau portrait karakter).

### 9. Import
- Import draft dari `.docx` / `.md` jadi chapter + scene baru di Supabase.
- Minimal: satu file → satu chapter (scene split manual belakangan kalau perlu), biar migrasi draft lama gak copy-paste manual.

### 10. Trash
- Halaman "recently deleted" per project: nampilin entitas yang `deleted_at` terisi (chapter, scene, note, character, plot point, worldbuilding entry, illustration).
- Bisa restore (`deleted_at` = null) atau permanent delete manual dari sini.

### 11. Global Search
- Cari across chapters/notes/characters/plot points/worldbuilding dalam satu project, dari satu search bar (misal di Topbar).
- Hasil dikelompokkan per tipe entitas, klik hasil langsung ke halaman terkait.

## Fase Pengembangan

Setiap fase harus selesai & lolos kriteria sebelum lanjut ke fase berikutnya. Jangan mulai fase baru kalau fase sebelumnya belum stabil.

**Catatan penting untuk Claude Code:** kriteria "selesai kalau" di bawah ini adalah syarat teknis minimum (build sukses, tidak ada error, dll) — bukan pengganti user testing. Setelah tiap fase selesai secara teknis, **STOP dan minta user untuk cek/test manual dulu** (jalanin `npm run dev`, coba fitur di browser) sebelum lanjut ke fase berikutnya. Jangan lanjut otomatis ke fase selanjutnya hanya karena build/lint lolos.

### Fase 0 — Foundation
1. Scaffold project (`create-next-app` + TypeScript + Tailwind), setup `tailwind.config.ts` (design tokens dari section Design & Layout Guidelines) & `tsconfig.json` (`strict: true`).
2. Setup Supabase project + client (server & browser client) + Storage bucket + Auth, buat schema tabel (`projects`, `chapters`, `scenes`, `notes`, `characters`, `plot_points`, `worldbuilding_entries`, `illustrations`) + RLS policy per user.

**Selesai kalau:** `npm run build` sukses tanpa TypeScript error, koneksi ke Supabase berhasil (bisa read/write dummy row), tidak ada file custom CSS selain `globals.css` reset minimal.

### Fase 1 — Auth & Dashboard
3. Halaman Login/Register pakai Supabase Auth (email/password atau magic link).
4. Dashboard: grid kartu project milik user yang login, bisa create/rename/delete project.

**Selesai kalau:** user bisa daftar/login/logout, halaman yang butuh auth ke-redirect ke login kalau belum login, dashboard cuma nampilin project milik user yang sedang login (RLS teruji, bukan cuma filter di client).

### Fase 2 — Layout Shell
5. Bangun Sidebar, Topbar, Content area (root layout, di dalam satu project).
6. Test responsive di 3 breakpoint (mobile/tablet/desktop).

**Selesai kalau:** tidak ada horizontal scroll tak sengaja, tidak ada elemen overlap/ke-cut di mobile, semua warna/spacing pakai token dari `tailwind.config.ts` (no hardcoded hex/px), navigasi antar section (editor/outline/notes/dst) berfungsi meski halaman masih kosong.

### Fase 3 — Core Writing (Editor + Outline)
7. Editor dasar, baca-tulis langsung ke Supabase (debounced write, no local-first), termasuk save status indicator (saved/saving/failed + retry).
8. Outline: hierarki Project → Chapter → Scene dari Supabase, drag-and-drop reorder, status per chapter.
9. Version history: snapshot berkala ke `chapter_versions`/`scene_versions`, halaman/panel riwayat + rollback.

**Selesai kalau:** nulis di editor tersimpan ke Supabase dan muncul lagi setelah refresh, reorder chapter di outline langsung update `order` field di DB, tidak ada state yang "nyangkut" di local cache, save status indicator akurat mencerminkan kondisi network/write, rollback ke versi sebelumnya berfungsi.

### Fase 4 — Story Bible (Notes, Character, Plot, Worldbuilding)
10. Notes (bebas + opsional link ke chapter).
11. Character (profil, role, arc notes) + relationship map (`character_relationships`, list relasi di detail karakter).
12. Plot (plot point/beat, link ke chapter, status, reorder).
13. Worldbuilding (entry per kategori).
14. Trash: halaman "recently deleted" per project, semua delete dari fase 1-4 pakai soft-delete (`deleted_at`), bisa restore/permanent delete dari sini.

**Selesai kalau:** keempat modul bisa CRUD penuh (create/read/update/delete, delete = soft-delete) langsung ke Supabase, cross-link antar modul (misal plot point ↔ chapter) tersimpan dan bisa ditampilkan, relationship antar karakter tersimpan dan tampil di detail karakter, halaman Trash bisa restore entitas yang ke-delete dari modul manapun.

### Fase 5 — Illustration
13. Upload gambar ke Supabase Storage, gallery view per project.
14. Link illustration ke character/scene/worldbuilding entry, preview/lightbox.

**Selesai kalau:** upload & tampil gambar berhasil lewat Supabase Storage (bukan public folder/base64), gallery bisa difilter/tampil per project, link ke modul lain berfungsi.

### Fase 6 — Export & Import
15. Export ke `.docx` / `.pdf` / `.md`, per chapter/per modul/seluruh project.
16. Opsional: sertakan illustration yang ter-link ke dalam hasil export.
17. Import draft `.docx`/`.md` jadi chapter + scene baru.

**Selesai kalau:** hasil export berisi data ter-update dari Supabase (bukan snapshot lama), format file valid dan bisa dibuka di aplikasi terkait (Word/PDF reader/markdown viewer), import berhasil bikin chapter + scene baru dari file yang di-upload dan langsung tersimpan di Supabase.

### Fase 7 — Global Search
18. Search bar (misal di Topbar) yang query across chapters/notes/characters/plot points/worldbuilding dalam satu project.
19. Hasil dikelompokkan per tipe entitas, klik hasil navigate ke halaman terkait.

**Selesai kalau:** search mengembalikan hasil relevan dari semua modul (bukan cuma satu tabel), hasil ke-grup jelas per tipe, klik hasil membawa ke halaman/detail yang tepat, performa search masih responsif walau data project udah banyak.

---

## Aturan Tambahan — Anti-Ambiguitas (v1.1)

Section ini menutup celah keputusan yang bisa ditafsirkan bebas oleh Claude Code kalau tidak ditegaskan sejak awal. **Baca ini sebelum menyentuh baris kode pertama.**

### 1. React Query vs "no cache layer"
React Query (kalau dipakai) **hanya boleh berfungsi sebagai fetch/cache sementara milik library itu sendiri** (in-memory, request-scoped, dengan `staleTime` pendek) — **bukan** sebagai source of truth atau pengganti offline cache. Artinya:
- Boleh: pakai React Query buat dedupe request & loading/error state di client component.
- Tidak boleh: mengandalkan cache React Query sebagai satu-satunya tempat data hidup, invalidation manual yang bikin data "nyangkut" stale, atau nyimpen data itu lebih lama dari lifetime komponen yang fetch.
- Kalau ragu antara React Query vs server component fetch langsung: **default ke server component / server action**, React Query cuma dipakai kalau memang butuh client-side refetch interaktif (misal live search).

### 2. Draft editor di Zustand
**Draft editor hanya hidup selama halaman/komponen editor itu terbuka (in-memory, request-scoped).** Begitu save ke Supabase berhasil, draft di Zustand store **dibuang** dan tampilan balik mengambil data dari Supabase (bukan terus dipertahankan sebagai "sumber tampilan"). Kalau user refresh/keluar sebelum save berhasil, draft yang belum tersimpan **hilang** — ini konsekuensi sadar dari prinsip "no local-first", bukan bug. `SaveStatusIndicator` harus jelas kelihatan supaya user tahu kapan aman untuk keluar.

### 3. Hard stop tiap akhir fase
**INI ADALAH HARD STOP.** Setelah kriteria "selesai kalau" satu fase terpenuhi secara teknis, Claude Code **wajib berhenti total** — jangan mulai baris kode fase berikutnya walaupun context window masih panjang, walaupun terasa "sekalian aja". Tunggu konfirmasi eksplisit dari user (bukan asumsi "user pasti setuju lanjut") sebelum mulai fase baru.

### 4. Version history — snapshot manual
Snapshot ke `chapter_versions`/`scene_versions` **dibuat manual lewat tombol "Simpan Versi"** di editor, bukan otomatis per save/interval/jumlah karakter. Autosave debounced (ke Supabase langsung) tetap jalan seperti biasa untuk mencegah kehilangan tulisan — itu terpisah dari version history. `VersionHistoryPanel.tsx` menampilkan daftar snapshot manual ini plus tombol rollback.

### 5. Rich text editor: **TipTap**
Dipilih karena dibangun di atas ProseMirror (matang, banyak dipakai buat aplikasi long-form writing), dan model extension-nya (`editor.isActive()`) langsung menyelesaikan pola bug toggle bold/heading yang pernah muncul di versi sebelumnya. Jangan ganti ke Lexical/Plate/BlockNote/textarea biasa tanpa keputusan eksplisit baru.

### 6. Drag-and-drop: **dnd-kit**
Default assumption (belum dikonfirmasi user) — dipilih karena aktif dimaintain, accessible (keyboard support), dan kompatibel dengan Next.js App Router/SSR tanpa masalah. `react-beautiful-dnd` sudah deprecated, hindari. Dipakai konsisten untuk reorder chapter (Outline) dan drag scene nested.

### 7. Export library
Default assumption (belum dikonfirmasi user):
- **DOCX:** package `docx` (generate dari struktur data, bukan konversi HTML).
- **PDF:** `@react-pdf/renderer` (compose lewat komponen React di server, hindari headless browser/puppeteer yang berat buat serverless function di Vercel).
- **Markdown:** generate manual (string templating dari data Supabase), tidak butuh library tambahan.

Kalau kebutuhan format PDF ternyata kompleks (layout mirip cetak buku beneran), ini keputusan yang perlu direvisit di Fase 6, bukan diputuskan diam-diam di tengah implementasi.

### 8. Server Actions sebagai pola utama
**Server Actions adalah pola default untuk semua mutasi/fetch** (sesuai `lib/actions/*.ts` di file breakdown). Route Handler (`/app/api/.../route.ts`) **hanya** dipakai untuk kasus yang memang butuh REST endpoint asli — misalnya webhook dari service eksternal, atau response non-HTML (file stream). Jangan campur kedua pola untuk concern yang sama (misal jangan ada `getChapters` versi server action DAN versi route handler berbarengan).

### 9. Auth method: **email/password saja**
Tidak pakai magic link. `LoginForm.tsx` cukup satu form dengan field email + password (login & register).

### 10. Larangan file/folder di luar breakdown
**Jangan membuat file atau folder baru di luar yang tercantum di `inkpadv2-file-breakdown.md`** (misal folder `utils/`, `hooks/` di luar yang sudah didefinisikan, atau `services/` baru) kecuali benar-benar diperlukan — dan kalau memang diperlukan, **berhenti dan tanya user dulu** sebelum membuatnya, jelaskan kenapa struktur yang ada belum cukup. Ini mencegah struktur folder "melebar" diam-diam dari yang sudah direncanakan rapi di breakdown.
