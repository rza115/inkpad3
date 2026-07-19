-- Fase 11: inline margin note — catatan nempel ke rentang teks tertentu
-- di scene, ditandai lewat mark <span data-note-id="..."> di HTML.
-- Jalankan di Supabase SQL Editor.

create table if not exists public.inline_notes (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null references public.scenes(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists inline_notes_scene_id_idx
  on public.inline_notes (scene_id);

alter table public.inline_notes enable row level security;

-- RLS via join scene → chapter → projects (pola PERSIS scene_versions Fase 3,
-- bukan pola baru). Akses hanya kalau scene ada di chapter milik project user.
create policy "inline_notes_owner" on public.inline_notes
  for all
  using (
    exists (
      select 1 from public.scenes s
      join public.chapters c on c.id = s.chapter_id
      join public.projects p on p.id = c.project_id
      where s.id = inline_notes.scene_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.scenes s
      join public.chapters c on c.id = s.chapter_id
      join public.projects p on p.id = c.project_id
      where s.id = inline_notes.scene_id
        and p.user_id = auth.uid()
    )
  );
