-- Creates the private storage bucket project files are uploaded into, and
-- RLS on storage.objects mirroring the existing `files` table policy: axel
-- can do anything, accepted org members can read and upload within their
-- own project's folder (object paths are named `{project_id}/...`), and
-- only axel can delete. Matches the "members upload files into own
-- project" pattern already used for the `files` metadata table in 0001.

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

drop policy if exists "axel manages project files storage" on storage.objects;
create policy "axel manages project files storage" on storage.objects
  for all using (bucket_id = 'project-files' and is_axel_admin())
  with check (bucket_id = 'project-files' and is_axel_admin());

drop policy if exists "members read own project files storage" on storage.objects;
create policy "members read own project files storage" on storage.objects
  for select using (
    bucket_id = 'project-files'
    and project_org_id(((storage.foldername(name))[1])::uuid) in (select my_org_ids())
  );

drop policy if exists "members upload own project files storage" on storage.objects;
create policy "members upload own project files storage" on storage.objects
  for insert with check (
    bucket_id = 'project-files'
    and project_org_id(((storage.foldername(name))[1])::uuid) in (select my_org_ids())
  );
