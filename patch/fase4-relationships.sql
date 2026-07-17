-- Fase 4: tabel character_relationships (jalankan di Supabase SQL Editor)
-- Relationship antar karakter: keluarga, rival, mentor, pasangan, dll (label bebas).

create table if not exists public.character_relationships (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  related_character_id uuid not null references public.characters(id) on delete cascade,
  relationship_type text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  check (character_id <> related_character_id)
);

alter table public.character_relationships enable row level security;

-- RLS via project (pola sama dengan tabel lain)
create policy "character_relationships_owner" on public.character_relationships
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = character_relationships.project_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = character_relationships.project_id
        and p.user_id = auth.uid()
    )
  );

create index if not exists character_relationships_character_idx
  on public.character_relationships (character_id);
create index if not exists character_relationships_related_idx
  on public.character_relationships (related_character_id);
