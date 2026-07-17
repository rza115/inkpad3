-- ===== 8 tabel inti (Fase 0) =====
  create table projects (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    created_at timestamptz not null default now(),
    deleted_at timestamptz
  );

  create table chapters (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    title text not null,
    "order" integer not null default 0,
    status text not null default 'draft', -- draft | revisi | selesai
    created_at timestamptz not null default now(),
    deleted_at timestamptz
  );

  create table scenes (
    id uuid primary key default gen_random_uuid(),
    chapter_id uuid not null references chapters(id) on delete cascade,
    content text not null default '',
    "order" integer not null default 0,
    created_at timestamptz not null default now(),
    deleted_at timestamptz
  );
  
  create table notes (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    title text not null,
    content text not null default '',
    linked_chapter_id uuid references chapters(id) on delete set null,
    created_at timestamptz not null default now(),
    deleted_at timestamptz
  );

  create table characters (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    name text not null,
    description text not null default '',
    role text not null default 'side', -- protagonist | antagonist | side
    arc_notes text not null default '',
    created_at timestamptz not null default now(),
    deleted_at timestamptz
  );

  create table plot_points (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    title text not null,
    description text not null default '',
    "order" integer not null default 0,
    linked_chapter_id uuid references chapters(id) on delete set null,
    status text not null default 'planned', -- planned | in_progress | resolved
    created_at timestamptz not null default now(),
    deleted_at timestamptz
  );
  
  create table worldbuilding_entries (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    category text not null,
    title text not null,
    content text not null default '',
    created_at timestamptz not null default now(),
    deleted_at timestamptz
  );

  create table illustrations (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    title text not null,
    image_path text not null, -- path di Storage bucket "illustrations"
    linked_character_id uuid references characters(id) on delete set null,
    linked_scene_id uuid references scenes(id) on delete set null,
    linked_worldbuilding_id uuid references worldbuilding_entries(id) on delete set null,
    created_at timestamptz not null default now(),
    deleted_at timestamptz
  );
  
  -- ===== RLS =====
  alter table projects enable row level security;
  alter table chapters enable row level security;
  alter table scenes enable row level security;
  alter table notes enable row level security;
  alter table characters enable row level security;
  alter table plot_points enable row level security;
  alter table worldbuilding_entries enable row level security;
  alter table illustrations enable row level security;

  -- projects: langsung cek user_id
  create policy "own projects" on projects
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

  -- helper: cek kepemilikan project
  create or replace function owns_project(pid uuid) returns boolean
  language sql security definer stable as $$
    select exists (select 1 from projects where id = pid and user_id = auth.uid());
  $$;
  
  create policy "own via project" on chapters
    for all using (owns_project(project_id)) with check (owns_project(project_id));
  create policy "own via chapter" on scenes
    for all using (exists (
      select 1 from chapters c where c.id = chapter_id and owns_project(c.project_id)
    )) with check (exists (
      select 1 from chapters c where c.id = chapter_id and owns_project(c.project_id)
    ));
  create policy "own via project" on notes
    for all using (owns_project(project_id)) with check (owns_project(project_id));
  create policy "own via project" on characters
    for all using (owns_project(project_id)) with check (owns_project(project_id));
  create policy "own via project" on plot_points
    for all using (owns_project(project_id)) with check (owns_project(project_id));
  create policy "own via project" on worldbuilding_entries
    for all using (owns_project(project_id)) with check (owns_project(project_id));
  create policy "own via project" on illustrations
    for all using (owns_project(project_id)) with check (owns_project(project_id));

  -- ===== Storage bucket (private) =====
  insert into storage.buckets (id, name, public) values ('illustrations','illustrations', false);

  create policy "own illustration files" on storage.objects
    for all using (
      bucket_id = 'illustrations' and (storage.foldername(name))[1] = auth.uid()::text
    ) with check (
      bucket_id = 'illustrations' and (storage.foldername(name))[1] = auth.uid()::text
    );