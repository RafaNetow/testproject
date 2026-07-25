-- Private bucket for invoices and contracts. Unlike project-files (which
-- any accepted org member can read), these are financial/legal documents,
-- so read access is restricted to the 'owner' role specifically — matching
-- the existing "owners see own org invoices"/"owners see own org
-- contracts" table policies. Objects are stored as
-- {org_id}/invoices/... or {org_id}/contracts/....

insert into storage.buckets (id, name, public)
values ('org-documents', 'org-documents', false)
on conflict (id) do nothing;

drop policy if exists "axel manages org documents storage" on storage.objects;
create policy "axel manages org documents storage" on storage.objects
  for all using (bucket_id = 'org-documents' and is_axel_admin())
  with check (bucket_id = 'org-documents' and is_axel_admin());

drop policy if exists "owners read own org documents storage" on storage.objects;
create policy "owners read own org documents storage" on storage.objects
  for select using (
    bucket_id = 'org-documents'
    and my_org_role(((storage.foldername(name))[1])::uuid) = 'owner'
  );
