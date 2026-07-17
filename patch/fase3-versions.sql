-- Fase 3: tabel version history (jalankan di Supabase SQL Editor)
-- Snapshot manual per chapter (tombol "Simpan Versi") + record granular per scene.

create table if not exists public.chapter_versions (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  content_snapshot text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.scene_versions (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null references public.scenes(id) on delete cascade,
  content_snapshot text not null,
  created_at timestamptz not null default now()
);

alter table public.chapter_versions enable row level security;
alter table public.scene_versions enable row level security;

-- RLS via join ke projects (pola sama dengan chapters/scenes)
create policy "chapter_versions_owner" on public.chapter_versions
  for all
  using (
    exists (
      select 1 from public.chapters c
      join public.projects p on p.id = c.project_id
      where c.id = chapter_versions.chapter_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.chapters c
      join public.projects p on p.id = c.project_id
      where c.id = chapter_versions.chapter_id
        and p.user_id = auth.uid()
    )
  );

create policy "scene_versions_owner" on public.scene_versions
  for all
  using (
    exists (
      select 1 from public.scenes s
      join public.chapters c on c.id = s.chapter_id
      join public.projects p on p.id = c.project_id
      where s.id = scene_versions.scene_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.scenes s
      join public.chapters c on c.id = s.chapter_id
      join public.projects p on p.id = c.project_id
      where s.id = scene_versions.scene_id
        and p.user_id = auth.uid()
    )
  );

create index if not exists chapter_versions_chapter_id_idx
  on public.chapter_versions (chapter_id, created_at desc);
create index if not exists scene_versions_scene_id_idx
  on public.scene_versions (scene_id, created_at desc);
