# InkPad v2 — Progress Notes

> File ini WAJIB dibaca duluan di tiap sesi baru (chat/Claude Code) sebelum lanjut kerja.
> Update bagian "Status Sekarang" & "Log Sesi" di akhir tiap sesi.

---

## Status Sekarang

**Fase aktif:** Fase 0 — Foundation (belum mulai)
**Progress fase ini:** 0%
**Terakhir dikerjakan:** —
**Blocker/isu terbuka:** —

---

## Peta Fase (checklist)

- [ ] **Fase 0** — Foundation (scaffold Next.js+TS+Tailwind, setup Supabase project+schema+RLS+storage bucket)
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

_(kosong — belum ada file yang dibuat)_

---

## Log Sesi

### Sesi 0 — [tanggal diisi pas mulai]
- Belum mulai coding. Konsep (`inkpadv2-concept.md`) dan file breakdown (`inkpadv2-file-breakdown.md`) sudah final.
- Ditambahkan addendum "Aturan Tambahan — Anti-Ambiguitas" (v1.1) ke `inkpadv2-concept.md`: klarifikasi React Query vs cache layer, scope draft Zustand, hard stop tiap fase, snapshot version history manual, pilihan library (TipTap, dnd-kit, docx, @react-pdf/renderer), Server Actions sebagai pola utama, auth email/password saja, larangan file/folder di luar breakdown.
- Next step: scaffold project Fase 0.

---

## Cara Pakai File Ini

1. Di awal sesi baru, bilang ke Claude/Claude Code: "baca PROGRESS.md dulu sebelum lanjut."
2. Di akhir sesi (atau pas token mulai mepet), minta update: "update PROGRESS.md sebelum sesi ini ditutup" — isi bagian Status Sekarang, checklist fase, file yang dibuat, dan tambah entry baru di Log Sesi.
3. Commit `PROGRESS.md` ke repo tiap kali diupdate, biar riwayatnya ikut ke-track di git juga.
