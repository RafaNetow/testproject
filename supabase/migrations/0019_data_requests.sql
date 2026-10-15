-- ============================================================
-- Data requests: what Alchemica needs from the client
-- ============================================================
--
-- An engagement starts with the client sending their data (FTIR exports,
-- cure-oven logs, formulation records). The admin lists each item needed;
-- the client uploads into its slot and it turns "received". Clients only
-- ever read requests directly — fulfilling one goes through
-- fulfill_data_request(), which checks membership and that the file belongs
-- to the same project, so no broad update policy is needed.

create table data_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  details text,
  technique text,
  folder_id uuid references folders (id) on delete set null,
  due_date date,
  status text not null default 'requested' check (status in ('requested', 'received')),
  file_id uuid references files (id) on delete set null,
  requested_by uuid references profiles (id),
  received_at timestamptz,
  created_at timestamptz not null default now()
);
create index data_requests_project_idx on data_requests (project_id, created_at);

alter table data_requests enable row level security;

create policy "axel manages data requests" on data_requests
  for all using (is_axel_admin()) with check (is_axel_admin());

create policy "members read own data requests" on data_requests
  for select using (project_org_id(project_id) in (select my_org_ids()));

create or replace function fulfill_data_request(p_request uuid, p_file uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project uuid;
begin
  select project_id into v_project from data_requests where id = p_request;
  if v_project is null then
    raise exception 'Data request not found';
  end if;

  if not is_axel_admin() and project_org_id(v_project) not in (select my_org_ids()) then
    raise exception 'Not allowed to fulfil this request';
  end if;

  if not exists (select 1 from files where id = p_file and project_id = v_project) then
    raise exception 'That file is not part of this project';
  end if;

  update data_requests
  set status = 'received', file_id = p_file, received_at = now()
  where id = p_request;
end;
$$;

revoke all on function fulfill_data_request(uuid, uuid) from public, anon;
grant execute on function fulfill_data_request(uuid, uuid) to authenticated;
