-- ============================================================
-- Messages: one conversation per project between the client and Alchemica
-- ============================================================
--
-- Members of the client organisation and the Alchemica admin read and post
-- in their project's thread. Messages are append-only for clients (no edit or
-- delete policy). message_reads keeps one "read up to" timestamp per reader
-- per thread, which drives unread counts and the "Seen by" line.
-- Chat attachments land in a "Chat attachments" folder that clients can't
-- create themselves, so ensure_chat_folder() does it after checking access.

create table messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 4000),
  file_id uuid references files (id) on delete set null,
  created_at timestamptz not null default now()
);
create index messages_project_idx on messages (project_id, created_at);

alter table messages enable row level security;

create policy "axel manages messages" on messages
  for all using (is_axel_admin()) with check (is_axel_admin());

create policy "members read own project messages" on messages
  for select using (project_org_id(project_id) in (select my_org_ids()));

create policy "members post in own project threads" on messages
  for insert with check (
    author_id = auth.uid()
    and project_org_id(project_id) in (select my_org_ids())
  );

create table message_reads (
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table message_reads enable row level security;

-- Everyone in the thread may see who has read it ("Seen by Axel").
create policy "axel sees message reads" on message_reads
  for select using (is_axel_admin());
create policy "members see their thread's reads" on message_reads
  for select using (project_org_id(project_id) in (select my_org_ids()));

create policy "readers record their own reads" on message_reads
  for insert with check (
    user_id = auth.uid()
    and (is_axel_admin() or project_org_id(project_id) in (select my_org_ids()))
  );
create policy "readers update their own reads" on message_reads
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function ensure_chat_folder(p_project uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_folder uuid;
begin
  if not is_axel_admin() and project_org_id(p_project) not in (select my_org_ids()) then
    raise exception 'Not allowed to post in this thread';
  end if;

  select id into v_folder
  from folders
  where project_id = p_project and parent_folder_id is null and name = 'Chat attachments'
  limit 1;

  if v_folder is null then
    insert into folders (project_id, name) values (p_project, 'Chat attachments')
    returning id into v_folder;
  end if;

  return v_folder;
end;
$$;

revoke all on function ensure_chat_folder(uuid) from public, anon;
grant execute on function ensure_chat_folder(uuid) to authenticated;

-- New notification kind for chat messages.
alter table notifications drop constraint if exists notifications_kind_check;
alter table notifications
  add constraint notifications_kind_check check (
    kind in (
      'card', 'deliverable', 'file', 'meeting', 'decision', 'update', 'hours',
      'invoice', 'contract', 'team', 'project', 'client', 'prospect', 'message'
    )
  );

-- Live delivery to open threads; RLS still decides who receives each row.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table messages;
    alter publication supabase_realtime add table message_reads;
  end if;
exception
  when duplicate_object then null;
end;
$$;

-- Names for the people in a thread. Clients can't read other profiles, so this
-- returns only id, display name and whether they're Alchemica, after checking
-- the caller belongs to the project.
create or replace function thread_participants(p_project uuid)
returns table (id uuid, name text, is_admin boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_axel_admin() and project_org_id(p_project) not in (select my_org_ids()) then
    raise exception 'Not allowed to read this thread';
  end if;

  return query
  select p.id,
         coalesce(nullif(btrim(p.full_name), ''), 'Alchemica')::text,
         true
  from profiles p
  where p.platform_role = 'axel_admin'
  union all
  select m.user_id,
         coalesce(nullif(btrim(p.full_name), ''), split_part(m.invited_email, '@', 1), 'Someone')::text,
         false
  from org_memberships m
  join profiles p on p.id = m.user_id
  where m.org_id = project_org_id(p_project) and m.user_id is not null
    and p.platform_role <> 'axel_admin';
end;
$$;

revoke all on function thread_participants(uuid) from public, anon;
grant execute on function thread_participants(uuid) to authenticated;
