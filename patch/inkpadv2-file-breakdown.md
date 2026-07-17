# InkpadV2 — File Structure Breakdown per Fase

Breakdown ini melanjutkan `inkpadv2-concept.md`. Tujuannya: setiap file punya satu concern yang jelas, gampang discan, dan menghindari pola bug lama (global `window.supabase`, logic numpuk di satu file).

Ingat: **stop & test manual di tiap akhir fase** sebelum lanjut, sesuai instruksi di konsep awal.

---

## Fase 0 — Foundation

```
/app
  layout.tsx              <- root layout: font setup, <html>/<body>, import globals.css
  globals.css              <- Tailwind directives + reset minimal

/lib
  /supabase
    client.ts              <- browser client (createBrowserClient)
    server.ts               <- server client (createServerClient, dipakai di server components/actions)
    middleware.ts        <- helper buat refresh session token
  /types
    database.ts            <- generated types dari Supabase CLI (supabase gen types)

/middleware.ts              <- Next.js middleware, pakai lib/supabase/middleware.ts buat auth session refresh

tailwind.config.ts          <- design tokens (ink, parchment, wine, slate, brass, font families)
tsconfig.json                <- strict: true
.env.local                   <- SUPABASE_URL, SUPABASE_ANON_KEY (jangan di-commit)
```

**Supabase side (bukan file di repo, tapi setup):**
- Bikin project Supabase, catat URL + anon key
- Bikin 8 tabel dari data model (`projects`, `chapters`, `scenes`, `notes`, `characters`, `plot_points`, `worldbuilding_entries`, `illustrations`)
- Aktifin RLS di semua tabel, policy dasar: `user_id = auth.uid()` (atau via join ke `project_id` buat tabel yang gak punya `user_id` langsung)
- Bikin 1 Storage bucket (misal `illustrations`), private + policy per user

**Kenapa `lib/supabase` dipecah client/server/middleware:** ini yang langsung nyegah bug `window.supabase` — gak ada global UMD, semua import eksplisit dari file ini.

---

## Fase 1 — Auth & Dashboard

```
/app
  /login
    page.tsx                <- form login/register (client component)
  /(dashboard)
    page.tsx                <- server component, fetch projects milik user

/components
  /auth
    LoginForm.tsx           <- form + handleSubmit, panggil server action
  /dashboard
    ProjectGrid.tsx          <- grid kartu "rak buku"
    ProjectCard.tsx           <- satu kartu project
    CreateProjectModal.tsx    <- modal create project baru
    ProjectCardMenu.tsx      <- dropdown rename/delete per kartu
  /ui
    Button.tsx
    Modal.tsx
    Input.tsx

/lib
  /actions
    auth.ts                  <- signIn, signUp, signOut (server actions)
    projects.ts                <- getProjects, createProject, renameProject, deleteProject
  /types
    project.ts                 <- type Project (kalau mau terpisah dari database.ts generated)

/store
  useUIStore.ts               <- Zustand: modal open/close, dst (BUKAN nyimpen data project)
```

**Catatan:**
- `LoginForm.tsx` dipisah dari `page.tsx` karena butuh `"use client"`, sementara `page.tsx` dashboard tetap server component.
- `lib/actions/projects.ts` isinya cuma CRUD project — nanti fase 4 nambah `characters.ts`, `plot.ts` dengan pola sama.

---

## Fase 2 — Layout Shell

```
/app
  /(project)
    /[projectId]
      layout.tsx            <- shell khusus di dalam satu project: Sidebar + Topbar + content slot

/components
  /layout
    Sidebar.tsx               <- nav tree (chapters/characters/plot/dll), collapsible
    SidebarNavItem.tsx      <- satu item nav + ribbon indicator kalau active
    Topbar.tsx                <- project title, actions (export, dll placeholder)
    MobileNav.tsx            <- versi mobile sidebar (drawer/bottom sheet)

/store
  useUIStore.ts               <- tambah state: sidebarCollapsed
```

**Catatan:**
- `SidebarNavItem.tsx` dipisah dari `Sidebar.tsx` karena di sinilah "signature element" ribbon/bookmark active-state hidup — biar gampang di-tweak tanpa nyentuh logic Sidebar.
- `MobileNav.tsx` dipisah, bukan pakai CSS `hidden md:block` doang di komponen yang sama, biar breakpoint logic gak numpuk di satu file besar.
- Route group `(project)/[projectId]` memastikan tiap fitur (editor/outline/dst) otomatis dapat shell ini tanpa perlu import manual di tiap page.

---

## Fase 3 — Core Writing (Editor + Outline)

```
/app
  /(project)/[projectId]
    /editor/[chapterId]
      page.tsx               <- server component, fetch chapter + scenes
    /outline
      page.tsx                <- server component, fetch hierarki project

/components
  /editor
    EditorCanvas.tsx        <- parchment canvas, area nulis (client component)
    EditorToolbar.tsx        <- formatting controls
    WordCountBadge.tsx     <- word count & reading time (monospace utility text)
    SaveStatusIndicator.tsx  <- badge saved/saving/failed + tombol retry
    VersionHistoryPanel.tsx  <- list snapshot + tombol rollback
  /outline
    ChapterList.tsx           <- list chapter, drag-drop container
    ChapterListItem.tsx      <- satu chapter row + status badge
    SceneDragList.tsx         <- nested drag-drop scene per chapter

/lib
  /actions
    chapters.ts               <- getChapters, updateChapterOrder, updateChapterStatus
    scenes.ts                  <- getScenes, updateSceneContent (debounced write), updateSceneOrder
    versions.ts                <- createChapterVersion, createSceneVersion, getVersions, rollbackToVersion
  /hooks
    useDebouncedSave.ts     <- reusable debounce hook buat editor autosave, expose status (saving/saved/failed) buat SaveStatusIndicator

/store
  useEditorStore.ts          <- draft state sebelum ter-save (UI-only, bukan copy data Supabase)
```

**Catatan:**
- `useDebouncedSave.ts` dipisah jadi hook reusable karena bakal kepake lagi di Notes/Character/Plot (semua butuh debounced write ke Supabase, no local-first) — hook ini juga yang jadi sumber state buat `SaveStatusIndicator.tsx`, biar logic retry gak duplikat di tiap modul.
- `useEditorStore.ts` cuma nampung draft yang belum ke-save + status "saving/saved" — begitu berhasil save, source of truth balik ke Supabase, bukan disimpan permanen di store.
- `versions.ts` dipisah dari `chapters.ts`/`scenes.ts` karena beda concern (snapshot & rollback, bukan CRUD utama) — snapshot trigger-nya bisa dipanggil dari dalam `updateSceneContent`/update chapter tapi logic-nya sendiri di file ini.

---

## Fase 4 — Story Bible (Notes, Character, Plot, Worldbuilding)

```
/app
  /(project)/[projectId]
    /notes
      page.tsx
    /characters
      page.tsx                 <- grid semua karakter
      /[characterId]
        page.tsx                <- detail karakter
    /plot
      page.tsx
    /worldbuilding
      page.tsx

/app
  /(project)/[projectId]
    /trash
      page.tsx                 <- list semua entitas deleted_at terisi, cross-modul

/components
  /notes
    NoteList.tsx
    NoteEditor.tsx            <- form + link-to-chapter selector
  /characters
    CharacterGrid.tsx
    CharacterCard.tsx
    CharacterForm.tsx        <- shared buat create & edit
    RelationshipList.tsx    <- daftar relasi di detail karakter
    RelationshipFormModal.tsx <- tambah/edit relasi (pilih karakter lain + tipe relasi)
  /plot
    PlotPointList.tsx
    PlotPointItem.tsx        <- status badge + link ke chapter
  /worldbuilding
    WorldbuildingList.tsx
    WorldbuildingEntryForm.tsx
    CategoryFilter.tsx        <- filter per kategori (lokasi/faksi/lore)
  /trash
    TrashList.tsx              <- list item ke-delete, dikelompokkan per tipe entitas
    TrashItemRow.tsx          <- satu row + tombol restore/permanent delete

/lib
  /actions
    notes.ts
    characters.ts
    plot.ts
    worldbuilding.ts
    relationships.ts           <- getRelationships, createRelationship, deleteRelationship
    trash.ts                     <- getDeletedItems (cross-tabel), restoreItem, permanentDelete
```

**Catatan:**
- Empat modul ini strukturnya paralel sengaja — begitu satu modul (misal `characters`) kelar polanya, tiga lainnya tinggal copy pola yang sama, bukan didesain ulang dari nol.
- `CharacterForm.tsx` dipakai buat create & edit (bukan dua form terpisah) biar validasi & field gak duplikat.
- `relationships.ts` dipisah dari `characters.ts` karena `character_relationships` tabel terpisah dengan query pattern beda (join dua arah character_id ↔ related_character_id).
- `trash.ts` isinya query lintas-tabel (union semua entitas yang `deleted_at IS NOT NULL`) — sengaja dipisah dari action file lain karena scope-nya cross-modul, bukan spesifik satu tabel. Setiap `delete` action di `chapters.ts`, `scenes.ts`, `characters.ts`, dll dari fase-fase sebelumnya perlu diubah jadi soft-delete (`update deleted_at`, bukan `delete`).

---

## Fase 5 — Illustration

```
/app
  /(project)/[projectId]
    /illustration
      page.tsx                 <- gallery view

/components
  /illustration
    IllustrationGallery.tsx
    IllustrationCard.tsx
    UploadDropzone.tsx       <- upload ke Supabase Storage
    ImageLightbox.tsx         <- preview full-size
    LinkEntitySelector.tsx  <- pilih link ke character/scene/worldbuilding

/lib
  /actions
    illustrations.ts          <- uploadImage (ke Storage bucket), getIllustrations, linkIllustration, deleteIllustration
```

**Catatan:**
- `UploadDropzone.tsx` dipisah dari `IllustrationGallery.tsx` karena logic upload (progress, error handling Storage) beda concern dari logic display grid.
- `LinkEntitySelector.tsx` reusable — dropdown/search buat pilih character/scene/worldbuilding entry, bisa dipakai lagi kalau nanti ada fitur cross-link lain.

---

## Fase 6 — Export & Import

```
/app
  /(project)/[projectId]
    /export
      page.tsx                 <- pilih scope export (chapter/modul/full project) + trigger
    /import
      page.tsx                  <- upload file + pilih target project, trigger import

/components
  /export
    ExportScopeSelector.tsx
    ExportFormatSelector.tsx  <- docx/pdf/md
    ExportOptionsPanel.tsx    <- include illustration toggle, dll
  /import
    ImportDropzone.tsx        <- upload .docx/.md
    ImportPreview.tsx          <- preview hasil parsing sebelum konfirmasi simpan

/lib
  /export
    toDocx.ts                  <- generate docx dari data project
    toPdf.ts                    <- generate pdf
    toMarkdown.ts             <- generate md
    fetchExportData.ts       <- satu fungsi fetch semua data terkait langsung dari Supabase saat export di-trigger
  /import
    fromDocx.ts                <- parse .docx jadi struktur chapter/scene
    fromMarkdown.ts          <- parse .md jadi struktur chapter/scene
  /actions
    export.ts                   <- server action yang orchestrate fetchExportData + format generator dipilih
    import.ts                    <- server action yang orchestrate parser + insert chapter/scene baru ke Supabase
```

**Catatan:**
- Tiap format generator (`toDocx.ts`, `toPdf.ts`, `toMarkdown.ts`) dipisah total karena library/pendekatannya beda-beda — jangan digabung di satu `export.ts` raksasa. Pola sama dipakai buat parser import (`fromDocx.ts`, `fromMarkdown.ts`).
- `fetchExportData.ts` dipisah dari generator supaya "data selalu fresh dari Supabase saat export" (kriteria selesai fase 6) gampang dites terpisah dari logic format-nya.
- `ImportPreview.tsx` dipisah dari `ImportDropzone.tsx` — biar user bisa cek hasil parsing (chapter/scene split-nya bener atau enggak) sebelum benar-benar ke-insert ke Supabase.

---

## Fase 7 — Global Search

```
/app
  /(project)/[projectId]
    /search
      page.tsx                  <- (opsional) halaman hasil search full, kalau gak cukup di dropdown Topbar

/components
  /layout
    Topbar.tsx                 <- (update dari fase 2) tambah SearchBar
  /search
    SearchBar.tsx              <- input + trigger query (debounced)
    SearchResultsDropdown.tsx <- hasil quick-search di Topbar
    SearchResultGroup.tsx    <- grup hasil per tipe entitas (chapter/note/character/plot/worldbuilding)
    SearchResultItem.tsx    <- satu baris hasil, klik → navigate

/lib
  /actions
    search.ts                  <- searchProject(projectId, query) — query paralel ke beberapa tabel, gabungkan & kelompokkan hasil
```

**Catatan:**
- `search.ts` sengaja satu fungsi entry point yang orchestrate query ke banyak tabel sekaligus (chapters, notes, characters, plot_points, worldbuilding_entries) — bukan dipecah per tabel di layer actions, karena dipanggil sebagai satu request dari `SearchBar.tsx`.
- Kalau nanti volume data project udah besar dan query paralel ke banyak tabel mulai lambat, pertimbangkan Postgres full-text search (`tsvector`) di sisi Supabase — tapi itu optimasi belakangan, bukan syarat awal.
- `Topbar.tsx` dari Fase 2 di-update di sini (bukan dibuat ulang) buat nambahin `SearchBar.tsx` — jangan taruh logic search di dalam `Topbar.tsx` langsung, biar tetap tipis.

---

## Fase 8 — Reader Mode & Theme

```
/app
  /(project)/[projectId]
    /read
      layout.tsx               <- scope load font reader (next/font/google), biar gak
                                   nambah bundle size di luar reader mode: Merriweather,
                                   Lora (serif) + Source Sans 3, Atkinson Hyperlegible
                                   (sans) sebagai CSS variable; Georgia web-safe langsung
                                   font-family, gak perlu next/font
      page.tsx                  <- scope "seluruh project": semua chapter berurutan
      /[chapterId]
        page.tsx                <- scope "per chapter"

/components
  /reader
    ReaderView.tsx             <- render konten baca (bukan editor canvas), apply CSS
                                   custom properties (--reader-bg/--reader-text/
                                   --reader-accent/--reader-font) dari useReaderStore
                                   lewat inline style di root
    ReaderToolbar.tsx          <- nav prev/next chapter, tombol buka ReaderThemePanel, exit
    ReaderThemePanel.tsx      <- preset (light/dark/sepia) + color picker custom
                                   (bg/text/accent) + font selector
    ReaderProgressBar.tsx      <- opsional, indikator posisi baca (scroll %)

/store
  useReaderStore.ts            <- Zustand + persist middleware (localStorage key
                                   `inkpad-reader-theme`), siapin `version` + `migrate`
                                   dari awal walau kosong: { preset, customColors:
                                   {bg,text,accent}, font, lastScope }
```

**Catatan:**
- Reader mode adalah mode *baca*, terpisah total dari Editor (TipTap) — gak ada toolbar formatting, gak ada autosave, cuma render bersih + kontrol tema.
- Warna custom dari color picker itu runtime user data, bukan token dev-time — jadi `ReaderView` pakai Tailwind arbitrary value (`bg-[var(--reader-bg)]`) yang nunjuk ke CSS variable, bukan hex ditulis manual di komponen. Semangat "no hardcoded hex" tetep kejaga, sumbernya cuma beda (state, bukan token statis).
- Tema reader (preset/custom/font) sengaja **gak** ngaruh ke dashboard/editor/modul lain — scope-nya cuma di dalam `/read`.
- `useReaderStore` pakai `persist` biar tema nempel di browser yang sama setelah refresh/tutup-buka, tapi tetap Zustand di layer API-nya — konsisten sama pola store lain di project ini.

**Selesai kalau:**
- Reader render bersih tanpa elemen editor (toolbar TipTap, dll).
- Scope chapter dan scope project dua-duanya jalan, user bisa pilih.
- Ganti tema di reader gak ngaruh ke tampilan dashboard/editor.
- Tema custom (warna + font) nempel setelah refresh/tutup-buka browser.
- Ada guard kontras minimal buat kombinasi warna custom (gak sampe teks gak kebaca).

---

## Prinsip yang berlaku di semua fase

1. Server action dipecah per domain tabel (`chapters.ts`, `characters.ts`, dst) — jangan satu `actions.ts` isi semua.
2. Komponen dipecah begitu ada logic tambahan (form, list item, drag handler) — `page.tsx` tetap tipis, cuma orchestration.
3. Zustand store cuma buat UI state, jangan pernah nyimpen salinan data Supabase.
4. `lib/types` boleh dipecah per domain (`project.ts`, `character.ts`, dst) begitu `database.ts` generated mulai berat dibaca.
5. Semua fungsi delete di `lib/actions/*.ts` (dari fase manapun) implementasinya soft-delete (`update deleted_at`), bukan `delete` beneran — konsisten sejak fase 1, bukan cuma di fase 4 pas Trash dibangun.
