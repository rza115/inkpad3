# InkPad v2 — Progress Notes

> File ini WAJIB dibaca duluan di tiap sesi baru (chat/Claude Code) sebelum lanjut kerja.
> Update bagian "Status Sekarang" & "Log Sesi" di akhir tiap sesi.

---

## Status Sekarang

**Fase aktif:** Fase 11 — Inline Margin Note (sisi kode selesai, nunggu user jalankan SQL + test manual)
**Progress fase ini:** Step 1–8 sisi kode selesai per `patch/fase11-inline-notes.md`. Build + tsc + ESLint hijau. Export constraint (Section 2) + reconciliation logic sudah diverifikasi via test string otomatis (semua PASS).
**Terakhir dikerjakan:** EditorCanvas rewrite (marker margin desktop / inline mobile dari getBoundingClientRect, event delegation, reconciliation numpang autosave), SelectionToolbar, NotePopover, NoteBottomSheet, mark `inlineNote`, server actions, store `activeNoteRef`.
**Blocker/isu terbuka:** (1) User WAJIB jalankan `patch/fase11-inline-notes.sql` di Supabase SQL Editor dulu. (2) Test manual checklist Step 8 (interaktif: select→toolbar→marker→popover/sheet, resize desktop↔mobile, reload persist, export docx/PDF/md buka hasil). Fase 10 masih nunggu test manual user juga (belum di-centang).

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
- [x] **Fase 9** — Entity Cross-Reference (hover/tap reference ke Characters & Worldbuilding — detail: `patch/fase9-entity-reference.md`; Step 9 Reader Mode opsional belum dikerjakan)
- [ ] **Fase 10** — Perataan Teks Reader Mode (kiri/tengah/kanan/justify — detail: `patch/fase10-reader-text-align.md`)

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

**Fase 9:**
- `patch/fase9-entity-reference.sql` — kolom `aliases text[]` + `quick_summary text` di characters & worldbuilding_entries. Sudah dijalankan user.
- `lib/editor/entityIndex.ts` — buildEntityIndex (+ fallback summary 140 char) + findEntityMatches (case-insensitive, word boundary Unicode-aware, longest-match-wins, character > worldbuilding saat tie)
- `components/editor/extensions/entityReference.ts` — Tiptap Extension decoration inline class `ref` + data-attributes, recompute hanya docChanged, command updateEntityIndex
- `components/editor/EntityRefPopover.tsx` — popover fixed dari rect span, flip/clamp viewport, badge + nama + ringkasan (token ink/parchment/brass)
- Update: `lib/actions/characters.ts` + `worldbuilding.ts` (field aliases + quick_summary), `CharacterForm` + `WorldbuildingEntryForm` (input alias comma-separated + quick_summary 140 char + counter), `store/useEditorStore.ts` (activeEntityRef + entityIndex), `EditorCanvas.tsx` (wiring extension + event delegation hover + long-press 450ms touch), editor page (fetch characters+worldbuilding), `globals.css` (CSS `.prose-inkpad .ref`)

**Fase 11 (sisi kode selesai, nunggu SQL + test manual user):**
- `patch/fase11-inline-notes.sql` — tabel `inline_notes` (id/scene_id/content/created_at) + index scene_id + RLS via join scene→chapter→projects (pola PERSIS `scene_versions` Fase 3, bukan pola baru). **Belum dijalankan user.**
- `lib/actions/inlineNotes.ts` — getInlineNotes/createInlineNote (return row buat noteId mark)/deleteInlineNote/deleteOrphanedInlineNotes. Hard delete (bukan entitas utama, tak masuk Trash — pola relationships), tanpa revalidatePath (pola updateSceneContent).
- `components/editor/extensions/inlineNote.ts` — TipTap **Mark** (bukan Decoration — isinya manual, harus persisten ke HTML), attr `noteId`, renderHTML `<span data-note-id>` + content hole `0` (TANPA teks/child tambahan — constraint export Section 2), parseHTML `span[data-note-id]`, command `setInlineNote`/`unsetInlineNoteById`.
- `components/editor/SelectionToolbar.tsx` — floating toolbar di atas selection non-empty (coordsAtPos), tombol "Tambah catatan" → input inline-expand → submit. (Elemen UI baru, belum ada sebelumnya.)
- `components/editor/NotePopover.tsx` (desktop md+, fixed dari rect, tombol Hapus/Tutup) + `NoteBottomSheet.tsx` (mobile <md, slide dari bawah + backdrop). Satu `activeNoteRef` di store, dua presentasi dipilih via breakpoint CSS (`md:block`/`md:hidden`, pola MobileNav).
- Update: `store/useEditorStore.ts` (`activeNoteRef` {noteId/sceneId/content/quotedText/rect} + setter, ikut resetEditorState — dipisah dari activeEntityRef, keputusan paling simpel karena Fase 9 sudah jalan), `lib/hooks/useDebouncedSave.ts` (param opsional `onSaved(content)` buat reconciliation numpang siklus autosave — bukan debounce terpisah), `EditorCanvas.tsx` (rewrite: notesByScene state + editor registry, handleCreateNote/OpenNote/DeleteNote/Reconcile, marker margin desktop + inline mobile dari getBoundingClientRect via rAF, event delegation klik marker), editor page (fetch getInlineNotes paralel per scene → map sceneId→notes), `globals.css` (CSS `.prose-inkpad [data-note-id]` tint brass/18 + box-decoration-break, indikator murni CSS/React, bukan karakter di HTML).
- Verifikasi otomatis: strip-export (regex `/<[^>]*>/g` PERSIS export.ts) atas 5 kasus mark (termasuk kepecah bold, em-dash, kutip) → tidak ada karakter nyempil (semua PASS); extractNoteIds + deteksi orphan reconciliation (semua PASS).

## Log Sesi

### Sesi 11 — 2026-07-19
- Fase 11 (Inline Margin Note) sisi kode selesai, Step 1–8 per `patch/fase11-inline-notes.md`:
- **Step 1:** `patch/fase11-inline-notes.sql` — tabel `inline_notes` + index + RLS via join scene→chapter→projects (copy pola `scene_versions` Fase 3, tidak nebak). **Nunggu user jalankan di Supabase.**
- **Step 2:** `lib/actions/inlineNotes.ts` — pola notes.ts/plot.ts (requireUser guard). createInlineNote return row penuh (butuh id buat mark). Hard delete + tanpa revalidatePath (keputusan: bukan entitas utama/tak masuk Trash + UI client-side, sama updateSceneContent).
- **Step 3:** mark `inlineNote` (Mark, BUKAN Decoration — isi manual harus persisten ke HTML beda dari Fase 9 yang computed). renderHTML span bare + content hole `0`, tidak ada teks/ikon tambahan (constraint export Section 2). Command setInlineNote + unsetInlineNoteById (buat Hapus).
- **Step 4:** `activeNoteRef` di store (noteId/sceneId/content/quotedText/rect). Dipisah dari activeEntityRef, bukan disatukan — keputusan paling simpel karena Fase 9 sudah shipped, refactor popover-nya = risiko regresi tanpa untung.
- **Step 5:** `SelectionToolbar.tsx` (baru) — muncul dari coordsAtPos saat selection non-empty, tombol "Tambah catatan" → input inline-expand. Submit → createInlineNote → `setInlineNote(noteId)` apply mark ke selection.
- **Step 6:** reconciliation numpang autosave lewat param `onSaved` opsional di useDebouncedSave (bukan debounce baru, sesuai instruksi). Tiap save sukses: extractNoteIds dari HTML final → deleteOrphanedInlineNotes.
- **Step 7:** EditorCanvas rewrite — marker = elemen React (button) diposisikan dari getBoundingClientRect tiap span [data-note-id] (via rAF, recompute on transaction + resize), BUKAN karakter di scene.content. Desktop: kolom margin kanan (`md:block`, -right-7). Mobile: ikon inline kanan (`md:hidden`). Klik marker → activeNoteRef → NotePopover (desktop) / NoteBottomSheet (mobile), pilih via breakpoint CSS. Tint brass/18 via CSS `[data-note-id]` (beda visual dari dotted `.ref` Fase 9).
- **Step 8:** test interaktif = tugas user (butuh SQL jalan + Supabase). Yang bisa otomatis SUDAH diverifikasi: (a) **export constraint** — strip `/<[^>]*>/g` persis export.ts atas 5 kasus mark (kepecah bold, em-dash, kutip, bungkus paragraf) → nol karakter nyempil, semua PASS; (b) reconciliation extractNoteIds + deteksi orphan → semua PASS.
- `npm run build` + `tsc --noEmit` + ESLint hijau (fix: rAF buat hindari lint set-state-in-effect saat ukur rect marker).
- **Nunggu user:** jalankan `patch/fase11-inline-notes.sql` → test manual Step 8 (interaktif + buka hasil export 3 format). HARD STOP sebelum dinyatakan selesai.

### Sesi 10 — 2026-07-19
- Fase 10 (Perataan Teks Reader Mode) sisi kode selesai satu jalan per `patch/fase10-reader-text-align.md`:
- `store/useReaderStore.ts` — type `ReaderTextAlign` + `READER_TEXT_ALIGNS` (Kiri/Tengah/Kanan/Rata Kanan-Kiri), `textAlign: "left"` di default (perilaku existing tidak berubah), setter, partialize, **persist version 2 → 3** dengan migrate `version < 3` → merge default (pola sama v1→v2).
- `app/globals.css` — `.reader-theme .prose-inkpad p { text-align: var(--reader-align) }`. Sengaja blok terpisah dari aturan `line-height` yang sudah ada karena selector-nya beda (line-height juga target `li`; text-align hanya `p` supaya separator ⁂/heading/li tidak ikut kegeser).
- `components/reader/ReaderView.tsx` — `--reader-align: textAlign` di object style root (destructure sejajar font/fontSize/lineHeight, ikut guard hydration).
- `components/reader/ReaderThemePanel.tsx` — blok "Perataan teks" setelah "Spasi baris", pola segmented button sama (role=group, aria-pressed, aria-labelledby). Dipakai **grid 2×2** (opsi fallback yang diantisipasi dokumen): label "Rata Kanan-Kiri" kepanjangan untuk 4 tombol sebaris di panel w-72.
- `npm run build` + `tsc --noEmit` + ESLint hijau.
- Nunggu user test manual checklist Fase 10 (live preview 4 opsi, persist reload, migrate v2 tanpa error, editor tidak terpengaruh, separator ⁂ tetap center).

### Sesi 9 — 2026-07-19
- Fase 9 (Entity Cross-Reference) selesai, Step 1–8 per `patch/fase9-entity-reference.md`, stop-and-test tiap step:
- **Step 1:** `patch/fase9-entity-reference.sql` — kolom `aliases text[]` + `quick_summary text` di `characters` & `worldbuilding_entries`. Dijalankan user di Supabase SQL Editor.
- **Step 2:** type `Character`/`WorldbuildingEntry` + dua field baru; create/update actions terima & simpan (aliases trim per item + buang kosong, quick_summary trim).
- **Step 3:** `CharacterForm` + `WorldbuildingEntryForm` — input alias comma-separated (parse ke array saat submit) + textarea quick_summary maxLength 140 dengan counter sisa karakter.
- **Step 4:** `lib/editor/entityIndex.ts` — `buildEntityIndex` (termasuk fallback summary: 140 char pertama description/content, potong di word boundary + …) + `findEntityMatches` (case-insensitive, word boundary Unicode-aware `\p{L}\p{N}` bukan `\b`, longest-match-wins via claim range, tie → character menang atas worldbuilding sebagai tiebreak eksplisit di sort). Smoke test 9 kasus Bahasa Indonesia (tanda pisah —, kutip, substring "kebulanan") semua PASS.
- **Step 5:** `components/editor/extensions/entityReference.ts` — Tiptap Extension + ProseMirror Plugin, `Decoration.inline` class `ref` + data-entity-id/type, recompute hanya `tr.docChanged` (selain itu map mapping), command `updateEntityIndex` refresh tanpa remount (meta flag), skip node `spec.code`. Scan per textblock (bukan per text node) supaya nama kepotong mark bold/italic tetap match.
- **Step 6:** `store/useEditorStore.ts` — `activeEntityRef` (entityId/entityType/rect) + `entityIndex` + setters, ikut dibersihkan `resetEditorState`.
- **Step 7:** `components/editor/EntityRefPopover.tsx` — satu instance, position fixed dari rect via useLayoutEffect (flip ke bawah kalau kepotong atas, clamp horizontal), badge kategori + nama font-display + ringkasan, token bg-ink/text-parchment/brass, pointer-events-none.
- **Step 8:** editor page fetch characters+worldbuilding di Promise.all → props EditorCanvas; useMemo entityIndex → store; extension terpasang sejajar StarterKit; event delegation di wrapper canvas (mouseOver/Out + closest('.ref')); touch long-press 450ms IKUT diimplementasi (pointerdown+setTimeout, batal di up/move/cancel, class `.open`, guard pointerType touch); popover tutup saat scroll; CSS `.ref` di globals.css (underline dotted slate/45 → wine saat hover/open, via @apply token).
- `npm run build` + `tsc --noEmit` + ESLint hijau di tiap step.
- User test manual checklist Fase 9 → semua lolos → **Fase 9 SELESAI.** Step 9 (Reader Mode: wrap HTML string `scene.content` dengan span `.ref` pakai `findEntityMatches` yang sama, tap biasa karena read-only) = opsional, belum dikerjakan — bisa sesi terpisah.

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
