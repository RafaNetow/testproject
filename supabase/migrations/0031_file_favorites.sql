-- Starred files and folders in the File Manager, per person (as on Minimal).
-- Each row stars exactly one file or one folder. People only see and change
-- their own stars, and only on items they can see.

create table file_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references profiles (id) on delete cascade,
  file_id uuid references files (id) on delete cascade,
  folder_id uuid references folders (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint file_favorites_one_item check ((file_id is null) <> (folder_id is null))
);
create unique index file_favorites_user_file_idx on file_favorites (user_id, file_id) where file_id is not null;
create unique index file_favorites_user_folder_idx on file_favorites (user_id, folder_id) where folder_id is not null;

alter table file_favorites enable row level security;

create policy "people see own favourites" on file_favorites
  for select using (user_id = auth.uid());

create policy "people star what they can see" on file_favorites
  for insert with check (
    user_id = auth.uid()
    and (
      is_axel_admin()
      or (file_id is not null and exists (select 1 from files f where f.id = file_id and project_org_id(f.project_id) in (select my_org_ids())))
      or (folder_id is not null and exists (select 1 from folders d where d.id = folder_id and project_org_id(d.project_id) in (select my_org_ids())))
    )
  );

create policy "people unstar own favourites" on file_favorites
  for delete using (user_id = auth.uid());
