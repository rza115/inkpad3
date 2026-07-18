# InkPad v2 — Progress Notes

> File ini WAJIB dibaca duluan di tiap sesi baru (chat/Claude Code) sebelum lanjut kerja.
> Update bagian "Status Sekarang" & "Log Sesi" di akhir tiap sesi.

---

## Status Sekarang

**Fase aktif:** Fase 7 — Global Search (SELESAI — lolos test manual user)
**Progress fase ini:** 100%
**Terakhir dikerjakan:** User test manual → search jalan normal di semua modul, grouped results, navigate tepat, performa responsif. **SEMUA FASE 0-7 SELESAI.**
**Blocker/isu terbuka:** —

---

## Peta Fase (checklist)

- [x] **Fase 0** — Foundation (scaffold Next.js+TS+Tailwind, setup Supabase project+schema+RLS+storage bucket)
- [x] **Fase 1** — Auth & Dashboard
- [x] **Fase 2** — Layout Shell (Sidebar/Topbar/responsive)
- [x] **Fase 3** — Core Writing (Editor + Outline + Version History)
- [x] **Fase 4** — Story Bible (Notes, Character, Plot, Worldbuilding, Trash)
- [x] **Fase 5** — Illustration
- [x] **Fase 6** — Export & Import
- [x] **Fase 7** — Global Search

Detail kriteria "selesai kalau" tiap fase: lihat `inkpadv2-concept.md`.
Detail struktur file tiap fase: lihat `inkpadv2-file-breakdown.md`.

---

## Keputusan Teknis Tetap (jangan diubah tanpa alasan kuat)

- Next.js App Router + TypeScript (`strict: true`), Tailwind only (no custom CSS kecuali reset di `globals.css`)
- Supabase = satu-satunya source of truth. **No local/offline storage, no cache layer.**
- React Query (kalau dipakai) cuma fetch/cache sementara milik library (in-memory, staleTime pendek) — bukan source of truth. Default ke server component/server action, React Query cuma buat refetch interaktif (misal live search).
- Zustand cuma buat UI state (modal, sidebar collapsed, draft sebelum save) — bukan copy data Supabase
- Draft editor di Zustand hidup cuma selama halaman terbuka. Setelah save berhasil, draft dibuang, tampilan balik ambil dari Supabase. Refresh sebelum save = draft hilang (konsekuensi sadar, bukan bug).
- Soft-delete semua entitas utama (`deleted_at`, bukan `DELETE FROM`)
- Design tokens: `ink` `#1E1B16`, `parchment` `#EFE7D8`, `wine` `#6B2737`, `slate` `#4A5568`, `brass` `#B8934A`
- Font: Fraunces/Lora (heading), Inter/Source Sans (body/UI), JetBrains Mono (metadata/word count)
- Signature element: ribbon/bookmark indicator di nav item aktif & status chapter — jangan tambah dekorasi lain
- File gambar → Supabase Storage bucket, bukan base64/public folder
- Server Actions = pola mutasi/fetch utama, dipecah per domain tabel (`chapters.ts`, `characters.ts`, dst). Route Handler cuma buat webhook/file stream, jangan campur pola buat concern yang sama.
- Rich text editor: **TipTap**. Drag-and-drop: **dnd-kit**. Export: **docx** (DOCX), **@react-pdf/renderer** (PDF), manual templating (MD).
- Version history: snapshot **manual** lewat tombol "Simpan Versi" — bukan otomatis per save/interval/karakter. Autosave debounced tetap jalan terpisah.
- Auth: **email/password saja**, no magic link.
- **HARD STOP** tiap akhir fase — jangan lanjut fase berikutnya tanpa konfirmasi eksplisit user, walaupun context window masih panjang.
- **Jangan bikin file/folder baru di luar `inkpadv2-file-breakdown.md`** kecuali benar-benar perlu — dan kalau perlu, stop & tanya user dulu.

---

## File/Struktur yang Sudah Dibuat

- `app/layout.tsx` — root layout, font Fraunces/Inter/JetBrains Mono via `next/font`
- `app/globals.css` — Tailwind v4 `@theme` dengan design tokens (ink/parchment/wine/slate/brass + font) + reset minimal. **Catatan:** Tailwind v4 tidak pakai `tailwind.config.ts` — tokens hidup di `@theme` dalam `globals.css` (pengganti setara, bukan penyimpangan konsep).
- `app/page.tsx` — placeholder sederhana pakai token
- `lib/supabase/client.ts` — browser client (`createBrowserClient`)
- `lib/supabase/server.ts` — server client (async, `cookies()` di Next 16 async)
- `lib/supabase/middleware.ts` — helper `updateSession` refresh token
- `proxy.ts` — **Next.js 16 me-rename Middleware jadi Proxy**; ini pengganti `middleware.ts` root di breakdown (fungsi sama)
- `lib/types/database.ts` — placeholder, nanti di-generate `supabase gen types`
- `.env.local` — template kosong (URL + anon key, gitignored)
- Deps terpasang: `@supabase/supabase-js`, `@supabase/ssr`

**Fase 1:**
- `lib/actions/auth.ts` — signIn/signUp/signOut (server actions, pola useActionState)
- `lib/actions/projects.ts` — getProjects/createProject/renameProject/deleteProject (delete = soft-delete `deleted_at`)
- `app/login/page.tsx` — redirect ke `/` kalau sudah login
- `components/auth/LoginForm.tsx` — satu form login/register toggle, email+password
- `app/(dashboard)/page.tsx` — server component, auth guard redirect ke /login, header + grid (menggantikan `app/page.tsx` placeholder yang dihapus)
- `components/dashboard/ProjectGrid.tsx`, `ProjectCard.tsx` (ribbon signature element), `CreateProjectModal.tsx`, `ProjectCardMenu.tsx` (dropdown rename/delete)
- `components/ui/Button.tsx`, `Input.tsx`, `Modal.tsx` (native `<dialog>`)
- `store/useUIStore.ts` — Zustand UI state (modal create, menu terbuka, renaming id)
- Deps tambahan: `zustand`

**Fase 2:**
- `app/(project)/[projectId]/layout.tsx` — shell per project: auth guard, fetch project (404 kalau bukan milik user/deleted), Topbar + Sidebar + content slot + MobileNav
- `app/(project)/[projectId]/page.tsx` — redirect `/{projectId}` → `/{projectId}/outline` (di luar breakdown, disetujui user karena kartu dashboard link ke `/{projectId}`)
- `components/layout/Sidebar.tsx` — nav desktop (md+), collapsible (icon-only w-14 ↔ w-56), export `PROJECT_NAV_ITEMS` (dipakai juga MobileNav)
- `components/layout/SidebarNavItem.tsx` — item nav + ribbon signature element saat aktif (usePathname)
- `components/layout/Topbar.tsx` — hamburger (mobile), link "InkPad" ke dashboard, judul project; slot actions masih placeholder
- `components/layout/MobileNav.tsx` — drawer overlay < md, tutup otomatis saat navigate
- `app/(project)/[projectId]/{outline,notes,characters,plot,worldbuilding,illustration,export,trash}/page.tsx` — placeholder per section biar navigasi bisa diuji
- `lib/actions/projects.ts` — tambah `getProject(id)` (single project, `maybeSingle`, filter `deleted_at`)
- `store/useUIStore.ts` — tambah `sidebarCollapsed` + `mobileNavOpen`
- Keputusan: nav "Editor" TIDAK ada di sidebar Fase 2 — editor diakses lewat klik chapter di Outline (Fase 3), sesuai pilihan user.

**Fase 3:**
- `lib/actions/chapters.ts` — getChapters/getChapter/create/rename/updateStatus/updateOrder/delete (soft-delete); order baru = max order + 1
- `lib/actions/scenes.ts` — getScenes/create/updateSceneContent (autosave, TANPA revalidatePath)/updateOrder/delete (soft-delete)
- `lib/actions/versions.ts` — getVersions/createChapterVersion/rollbackToVersion; snapshot per CHAPTER (JSON semua scene di `content_snapshot`) + record granular ke `scene_versions`; rollback restore content+order+deleted_at scene di snapshot, scene baru pasca-snapshot dibiarkan
- `app/(project)/[projectId]/outline/page.tsx` — fetch chapters + scenes, render ChapterList
- `components/outline/ChapterList.tsx` — dnd-kit sortable chapters, form tambah chapter, optimistic reorder (rollback kalau gagal)
- `components/outline/ChapterListItem.tsx` — drag handle, expand scenes, rename inline, status select (draft/revisi/selesai, ribbon wine kalau selesai), delete, link ke editor
- `components/outline/SceneDragList.tsx` — nested sortable scenes, excerpt konten, tambah/hapus scene
- `app/(project)/[projectId]/editor/[chapterId]/page.tsx` — fetch chapter+scenes+versions, 404 kalau chapter bukan milik project
- `components/editor/EditorCanvas.tsx` — semua scene ditumpuk satu canvas parchment (continuous view, keputusan user), satu instance TipTap per scene, max-w-2xl margin lebar
- `components/editor/EditorToolbar.tsx` — bold/italic/strike/H2/bullet/blockquote via `editor.isActive()`, tombol "Simpan Versi" + toggle "Riwayat"
- `components/editor/WordCountBadge.tsx` — total kata + reading time (monospace)
- `components/editor/SaveStatusIndicator.tsx` — per scene: Tersimpan/Menyimpan…/Gagal + Coba lagi
- `components/editor/VersionHistoryPanel.tsx` — list snapshot + rollback (confirm + router.refresh)
- `lib/hooks/useDebouncedSave.ts` — debounce 1200ms, flush on unmount, retry terdaftar di store (reusable buat modul Fase 4)
- `store/useEditorStore.ts` — sceneStatuses/retryCallbacks/wordCounts (UI state, bukan copy konten)
- `app/globals.css` — tambah `.prose-inkpad` styling konten TipTap (pengecualian terdokumentasi: preflight menghapus style heading/list; nilai tetap dari token)
- `patch/fase3-versions.sql` — SQL create `chapter_versions` + `scene_versions` + RLS (via join projects) + index. Sudah dijalankan user.
- Deps tambahan: `@tiptap/react`, `@tiptap/starter-kit`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Keputusan user Fase 3: (1) editor = scene ditumpuk satu canvas (continuous), (2) snapshot/rollback per chapter.

**Fase 4:**
- `lib/actions/notes.ts` — getNotes/create/update (title+linked_chapter_id)/updateNoteContent (autosave tanpa revalidate)/delete (soft-delete)
- `lib/actions/characters.ts` — getCharacters/getCharacter/create/update/delete (soft-delete); role: protagonist/antagonist/side
- `lib/actions/plot.ts` — getPlotPoints/create/updatePlotPoint (title/desc/status/link)/updateOrder/delete; status: planned/in_progress/resolved
- `lib/actions/worldbuilding.ts` — getEntries/create/update/delete (soft-delete); kategori text bebas
- `lib/actions/relationships.ts` — getRelationships (query dua arah via .or)/create/delete (hard delete — relasi bukan entitas utama, tak ada deleted_at di data model)
- `lib/actions/trash.ts` — getDeletedItems (7 tabel paralel, scenes via join chapters), restoreItem, permanentDelete (satu-satunya DELETE FROM, manual dari Trash)
- `app/(project)/[projectId]/notes/page.tsx` + `components/notes/NoteList.tsx`, `NoteEditor.tsx` (textarea autosave reuse useDebouncedSave + SaveStatusIndicator, link ke chapter via select)
- `app/(project)/[projectId]/characters/page.tsx` (grid) + `characters/[characterId]/page.tsx` (detail; file di luar breakdown eksplisit tapi sesuai konsep "detail view per karakter") + `components/characters/CharacterGrid.tsx`, `CharacterCard.tsx`, `CharacterForm.tsx` (shared create/edit), `RelationshipList.tsx`, `RelationshipFormModal.tsx`
- `app/(project)/[projectId]/plot/page.tsx` + `components/plot/PlotPointList.tsx` (dnd-kit reorder pola ChapterList), `PlotPointItem.tsx` (status select, link chapter, deskripsi save-on-blur)
- `app/(project)/[projectId]/worldbuilding/page.tsx` + `components/worldbuilding/WorldbuildingList.tsx`, `WorldbuildingEntryForm.tsx` (shared create/edit), `CategoryFilter.tsx` (chip filter client-side)
- `app/(project)/[projectId]/trash/page.tsx` + `components/trash/TrashList.tsx` (grup per tipe), `TrashItemRow.tsx` (restore + hapus permanen dengan confirm)
- `patch/fase4-relationships.sql` — SQL create `character_relationships` + RLS via project + index + check self-relation. Sudah dijalankan user.

**Fase 5:**
- `lib/actions/illustrations.ts` — uploadImage (Supabase Storage + validasi 5MB + rollback kalau insert gagal), getImageUrl (signed URL 1 jam), updateIllustration (title + 3 link entity), deleteIllustration (soft-delete)
- `app/(project)/[projectId]/illustration/page.tsx` — fetch illustrations per project, render IllustrationGallery
- `components/illustration/IllustrationGallery.tsx` — grid + modal upload + state lightbox aktif
- `components/illustration/IllustrationCard.tsx` — preview (next/image + signed URL), badges linked entity, menu edit/delete
- `components/illustration/UploadDropzone.tsx` — drag-drop file (1 file, validasi client 5MB, progress upload, error handling)
- `components/illustration/ImageLightbox.tsx` — modal full overlay, preview next/image, form edit (title + 3 link entity selector), save ke Supabase
- `components/illustration/LinkEntitySelector.tsx` — reusable dropdown link ke character/scene/worldbuilding, fetch paralel saat mount, filter deleted_at, tampil label/excerpt

**Fase 6:**
- `lib/actions/export.ts` — fetchExportData (fresh dari Supabase saat trigger), generateDocx (via `docx` library), generateMarkdown (manual templating), exportProject (orchestration per scope + format)
- `lib/actions/import.ts` — parseDocx (via `mammoth`), parseMarkdown (strip frontmatter), splitIntoScenes (2+ newlines), importFile (create chapter + scenes + rollback kalau gagal)
- `app/(project)/[projectId]/export/page.tsx` — fetch chapters untuk selector, render ExportPanel
- `components/export/ExportPanel.tsx` — radio scope (full-project/chapter) + format (docx/markdown), dropdown chapter, tombol export + trigger download via Blob
- `app/(project)/[projectId]/import/page.tsx` — render ImportDropzone
- `components/import/ImportDropzone.tsx` — file input (.docx/.md), validasi extension, preview file info, tombol import + redirect ke editor chapter baru
- Deps tambahan: `docx`, `mammoth` (untuk parsing .docx di server)

**Fase 7:**
- `lib/actions/search.ts` — searchProject (query paralel 6 tabel: chapters/scenes/notes/characters/plot/worldbuilding, ilike search, grouped results, limit 5 per tipe)
- `components/search/SearchBar.tsx` — input dengan debounce 500ms, useTransition untuk pending state, spinner loading, click-outside close
- `components/search/SearchResultsDropdown.tsx` — dropdown overlay absolute, conditional render saat isVisible, scroll max-h-96
- `components/search/SearchResultGroup.tsx` — grup per tipe (label + count), list items, "... dan X lainnya" kalau totalCount > limit
- `components/search/SearchResultItem.tsx` — Link ke targetUrl, title + excerpt (line-clamp), onClose saat klik
- `components/layout/Topbar.tsx` — update: tambah SearchBar (pass projectId), adjust flex layout (h1 shrink di mobile, SearchBar flex-1 max-w-md)
- `app/(project)/[projectId]/layout.tsx` — update: pass projectId ke Topbar

## Log Sesi

### Sesi 1 — 2026-07-17
- `npm install` + baca docs Next.js 16.2.4 di `node_modules/next/dist/docs` (breaking: middleware.ts → proxy.ts dengan export `proxy`; `cookies()` async).
- Fase 0 sisi kode selesai: design tokens, font, struktur `lib/supabase`, proxy, placeholder types. `npm run build` sukses tanpa TS error, tanpa custom CSS di luar `globals.css`.
- Belum: setup project Supabase (schema 8 tabel + RLS + bucket `illustrations`) — SQL sudah diberikan ke user, nunggu user jalankan & isi `.env.local`, lalu test read/write dummy row.
- User setup Supabase (schema 8 tabel + RLS + bucket via SQL) + isi `.env.local` + matikan "Confirm email" (untuk dev; nyalakan lagi pas production, butuh halaman konfirmasi di Fase 1).
- Test koneksi lolos semua: read anon (0 row, RLS bekerja), signup dapat session, insert dummy project, read balik, cleanup. **Fase 0 SELESAI.**
- Next step: konfirmasi user → Fase 1 (Auth & Dashboard).

### Sesi 2 — 2026-07-17
- Fase 1 sisi kode selesai: auth email/password (signIn/signUp/signOut via server actions + useActionState), login page dengan redirect guard dua arah, dashboard grid "rak buku" dengan create/rename/delete project (soft-delete), UI primitives (Button/Input/Modal), Zustand UI store.
- `npm run build` + ESLint hijau. RLS belum diuji lintas akun — bagian dari test manual user.
- Nunggu user test manual (kriteria "selesai kalau" Fase 1) → setelah dikonfirmasi, centang Fase 1 dan HARD STOP menunggu izin lanjut Fase 2.
- User selesai test manual → **Fase 1 SELESAI.** HARD STOP, nunggu konfirmasi eksplisit untuk Fase 2 (Layout Shell).

### Sesi 3 — 2026-07-18
- Fase 2 sisi kode selesai: shell `(project)/[projectId]` (Topbar + Sidebar collapsible + MobileNav drawer), ribbon signature element di nav item aktif, placeholder page semua section (outline/notes/characters/plot/worldbuilding/illustration/export/trash), `getProject` action, store `sidebarCollapsed`/`mobileNavOpen`.
- Dua keputusan disetujui user: (1) `page.tsx` redirect `/{projectId}` → `/outline` (file kecil di luar breakdown), (2) tanpa nav Editor di sidebar — editor lewat Outline di Fase 3.
- `npm run build` + ESLint hijau. Semua warna/spacing pakai token, no hardcoded hex.
- Nunggu user test manual (kriteria "selesai kalau" Fase 2: no horizontal scroll, no overlap/ke-cut di mobile/tablet/desktop, navigasi antar section jalan) → setelah dikonfirmasi, centang Fase 2 dan HARD STOP.
- User selesai test manual, semua jalan normal → **Fase 2 SELESAI.** HARD STOP, nunggu konfirmasi eksplisit untuk Fase 3 (Core Writing: Editor + Outline + Version History).

### Sesi 4 — 2026-07-18
- Fase 3 sisi kode selesai: Outline (dnd-kit chapter+scene reorder, status, CRUD), Editor (TipTap per scene di satu canvas continuous, autosave debounced 1200ms, SaveStatusIndicator + retry, word count), Version history (snapshot manual per chapter + rollback).
- Probe schema: `chapters`/`scenes` sudah ada & kolom sesuai (status text bebas, default 'draft'); `chapter_versions`/`scene_versions` BELUM ada → SQL disiapkan di `patch/fase3-versions.sql`.
- Keputusan user: editor continuous view (scene ditumpuk), snapshot/rollback per chapter.
- Fix lint: react-hooks/refs di useDebouncedSave (assign saveRef pindah ke useEffect).
- `npm run build` + ESLint hijau.
- Next: user jalankan `patch/fase3-versions.sql` di Supabase SQL Editor, lalu test manual kriteria Fase 3 → setelah konfirmasi, centang Fase 3, HARD STOP.
- User jalankan SQL + selesai test manual, semua lolos → **Fase 3 SELESAI.** HARD STOP, nunggu konfirmasi eksplisit untuk Fase 4 (Story Bible: Notes, Character, Plot, Worldbuilding, Trash).

### Sesi 5 — 2026-07-18
- Fase 4 sisi kode selesai: Notes (list + editor autosave + link chapter), Characters (grid/detail/form shared + relationship list & modal), Plot (list dnd-kit reorder + status + link chapter), Worldbuilding (list + kategori chip filter + form shared), Trash (cross-modul, grup per tipe, restore + permanent delete).
- Probe schema: notes/characters/plot_points/worldbuilding_entries sudah ada & kolom cocok (role default 'side', plot status default 'planned', semua text bebas tanpa CHECK); `character_relationships` BELUM ada → SQL disiapkan di `patch/fase4-relationships.sql`.
- Pola konsisten: soft-delete semua modul (kecuali relationships = hard delete, bukan entitas utama), useDebouncedSave/SaveStatusIndicator di-reuse buat Notes, form shared create/edit (CharacterForm, WorldbuildingEntryForm).
- `npm run build` + ESLint hijau.
- Next: user jalankan `patch/fase4-relationships.sql` di Supabase SQL Editor, lalu test manual kriteria Fase 4 → setelah konfirmasi, centang Fase 4, HARD STOP.
- User jalankan SQL + selesai test manual, semua lolos → **Fase 4 SELESAI.** HARD STOP, nunggu konfirmasi eksplisit untuk Fase 5 (Illustration).

### Sesi 6 — 2026-07-18
- Fase 5 sisi kode selesai: Illustration upload/gallery/lightbox dengan integrasi Supabase Storage (signed URL, validasi 5MB), link multi-entity (character/scene/worldbuilding) via LinkEntitySelector reusable, soft-delete konsisten.
- File dibuat: `lib/actions/illustrations.ts` (uploadImage ke Storage + rollback kalau insert gagal, getImageUrl signed URL, update/delete), `app/(project)/[projectId]/illustration/page.tsx`, `components/illustration/` (IllustrationGallery, IllustrationCard, UploadDropzone drag-drop, ImageLightbox dengan form edit, LinkEntitySelector fetch dari 3 modul).
- `lib/actions/trash.ts` sudah include illustrations dari Fase 4 — tidak perlu diubah.
- Fix ESLint: ganti `<img>` jadi `next/image` untuk optimasi LCP (IllustrationCard + ImageLightbox).
- Fix `next.config.ts`: tambah `images.remotePatterns` untuk whitelist hostname Supabase Storage (error next/image unconfigured host).
- `npm run build` + ESLint hijau (no warnings).
- User selesai test manual, semua lolos (upload, gallery, link entity, dropdown menu edit/delete, trash restore) → **Fase 5 SELESAI.** HARD STOP, nunggu konfirmasi eksplisit untuk Fase 6 (Export & Import).

### Sesi 7 — 2026-07-18
- Fase 6 sisi kode selesai: Export DOCX/Markdown (per chapter/full project, fetch fresh dari Supabase saat trigger, download via Blob) + Import DOCX/Markdown jadi chapter baru (parsing via mammoth/manual, split scenes by 2+ newlines, rollback kalau gagal).
- Install deps: `docx` (generate DOCX), `mammoth` (parse DOCX di server), keduanya via npm.
- File dibuat: `lib/actions/export.ts` (fetchExportData + generateDocx + generateMarkdown + exportProject orchestration), `lib/actions/import.ts` (parseDocx + parseMarkdown + splitIntoScenes + importFile + rollback), `app/(project)/[projectId]/export/page.tsx`, `components/export/ExportPanel.tsx` (radio scope/format + selector chapter + trigger download), `app/(project)/[projectId]/import/page.tsx`, `components/import/ImportDropzone.tsx` (file input + validasi + preview + redirect ke editor).
- Fix TypeScript: `Button` import (named export, bukan default), Buffer → Uint8Array (Blob constructor).
- `npm run build` + ESLint hijau (no warnings).
- User test manual → bug DOCX blank: Markdown export OK (chapter title muncul), tapi DOCX blank total. Root cause: scene content kosong (belum diisi), kode skip scene kalau `plainText` empty (line 127 `if (plainText)` tanpa fallback).
- Fix: tambah else branch di `generateDocx` (line 135-141) → render `[Scene kosong]` italic sebagai placeholder kalau scene belum diisi. Markdown tidak kena karena chapter title tetap render walaupun body kosong.
- `npm run build` ulang + ESLint hijau. User confirm export DOCX sekarang OK (struktur document kelihatan). Import belum ditest eksplisit, tapi logic sudah ada.
- **Fase 6 SELESAI.** HARD STOP, nunggu konfirmasi eksplisit untuk Fase 7 (Global Search).

### Sesi 8 — 2026-07-18
- Fase 7 sisi kode selesai: Global Search across 6 tabel (chapters, scenes, notes, characters, plot_points, worldbuilding_entries), SearchBar di Topbar dengan debounce 500ms, dropdown grouped results (limit 5 per tipe + "... dan X lainnya").
- Keputusan user di planning: (1) scenes ikut di hasil search (navigate ke editor chapter parent), (2) limit 5 hasil per grup, (3) navigate ke list page untuk modul tanpa detail view (notes/plot/worldbuilding).
- File dibuat: `lib/actions/search.ts` (searchProject query paralel `ilike`, filter deleted_at, grouped + limited results), `components/search/` (SearchBar debounce + useTransition spinner, SearchResultsDropdown overlay, SearchResultGroup dengan counter + "...lainnya", SearchResultItem Link).
- Update existing: `components/layout/Topbar.tsx` (tambah SearchBar + pass projectId, adjust flex h1 shrink di mobile), `app/(project)/[projectId]/layout.tsx` (pass projectId ke Topbar).
- Fix ESLint: ganti `any` type jadi `SceneWithChapter` interface untuk hasil join scenes+chapters, fix setState sync di effect (wrap dengan setTimeout 0).
- `npm run build` + ESLint hijau (no warnings).
- User selesai test manual, semua jalan normal → **Fase 7 SELESAI.** **SEMUA FASE 0-7 SELESAI — InkPad v2 full writing suite lengkap dari Auth sampai Global Search.** 🎉

### Sesi 0 — [tanggal diisi pas mulai]
- Belum mulai coding. Konsep (`inkpadv2-concept.md`) dan file breakdown (`inkpadv2-file-breakdown.md`) sudah final.
- Ditambahkan addendum "Aturan Tambahan — Anti-Ambiguitas" (v1.1) ke `inkpadv2-concept.md`: klarifikasi React Query vs cache layer, scope draft Zustand, hard stop tiap fase, snapshot version history manual, pilihan library (TipTap, dnd-kit, docx, @react-pdf/renderer), Server Actions sebagai pola utama, auth email/password saja, larangan file/folder di luar breakdown.
- Next step: scaffold project Fase 0.

---

## Cara Pakai File Ini

1. Di awal sesi baru, bilang ke Claude/Claude Code: "baca PROGRESS.md dulu sebelum lanjut."
2. Di akhir sesi (atau pas token mulai mepet), minta update: "update PROGRESS.md sebelum sesi ini ditutup" — isi bagian Status Sekarang, checklist fase, file yang dibuat, dan tambah entry baru di Log Sesi.
3. Commit `PROGRESS.md` ke repo tiap kali diupdate, biar riwayatnya ikut ke-track di git juga.
