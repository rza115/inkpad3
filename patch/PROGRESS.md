# InkPad v2 — Progress Notes

> File ini WAJIB dibaca duluan di tiap sesi baru (chat/Claude Code) sebelum lanjut kerja.
> Update bagian "Status Sekarang" & "Log Sesi" di akhir tiap sesi.

---

## Status Sekarang

**Fase aktif:** Fase 1 — Auth & Dashboard (kode selesai, nunggu user test manual)
**Progress fase ini:** 100% sisi kode — belum diverifikasi manual oleh user
**Terakhir dikerjakan:** Auth (login/register/logout email+password) + dashboard grid project dengan create/rename/delete (soft-delete). Build & lint hijau.
**Blocker/isu terbuka:** Nunggu user test manual: register/login/logout, redirect guard, CRUD project, RLS antar akun.

---

## Peta Fase (checklist)

- [x] **Fase 0** — Foundation (scaffold Next.js+TS+Tailwind, setup Supabase project+schema+RLS+storage bucket)
- [ ] **Fase 1** — Auth & Dashboard
- [ ] **Fase 2** — Layout Shell (Sidebar/Topbar/responsive)
- [ ] **Fase 3** — Core Writing (Editor + Outline + Version History)
- [ ] **Fase 4** — Story Bible (Notes, Character, Plot, Worldbuilding, Trash)
- [ ] **Fase 5** — Illustration
- [ ] **Fase 6** — Export & Import
- [ ] **Fase 7** — Global Search

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

### Sesi 0 — [tanggal diisi pas mulai]
- Belum mulai coding. Konsep (`inkpadv2-concept.md`) dan file breakdown (`inkpadv2-file-breakdown.md`) sudah final.
- Ditambahkan addendum "Aturan Tambahan — Anti-Ambiguitas" (v1.1) ke `inkpadv2-concept.md`: klarifikasi React Query vs cache layer, scope draft Zustand, hard stop tiap fase, snapshot version history manual, pilihan library (TipTap, dnd-kit, docx, @react-pdf/renderer), Server Actions sebagai pola utama, auth email/password saja, larangan file/folder di luar breakdown.
- Next step: scaffold project Fase 0.

---

## Cara Pakai File Ini

1. Di awal sesi baru, bilang ke Claude/Claude Code: "baca PROGRESS.md dulu sebelum lanjut."
2. Di akhir sesi (atau pas token mulai mepet), minta update: "update PROGRESS.md sebelum sesi ini ditutup" — isi bagian Status Sekarang, checklist fase, file yang dibuat, dan tambah entry baru di Log Sesi.
3. Commit `PROGRESS.md` ke repo tiap kali diupdate, biar riwayatnya ikut ke-track di git juga.
