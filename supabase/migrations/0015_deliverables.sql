-- Deliverables: the formal outputs of an engagement (a root-cause report, a
-- recommendation, a next-experiment plan) that Alchemica hands over and the
-- client signs off.
--
-- Lifecycle: draft (admin-only) -> in_progress -> in_review (the client sees
-- it and is asked to respond) -> approved | changes_requested -> in_review again.
--
-- Security model:
--   * Admin writes everything.
--   * Clients can read deliverables that are not drafts, and nothing else.
--   * Clients never UPDATE the table. Their only write is review_deliverable(),
--     a SECURITY DEFINER function that checks they are the workspace *owner*
--     and that the deliverable is actually awaiting review. A broad client
--     UPDATE policy would let them rewrite any column (the profiles.platform_role
--     mistake), so the write path is deliberately this narrow.

create table deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'in_progress', 'in_review', 'changes_requested', 'approved')),
  due_date date,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references profiles (id) on delete set null,
  review_note text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index deliverables_project_idx on deliverables (project_id, created_at);
create index deliverables_status_idx on deliverables (status) where status = 'in_review';

create table deliverable_files (
  deliverable_id uuid not null references deliverables (id) on delete cascade,
  file_id uuid not null references files (id) on delete cascade,
  primary key (deliverable_id, file_id)
);
create index deliverable_files_file_idx on deliverable_files (file_id);

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table deliverables enable row level security;

create policy "axel sees all deliverables" on deliverables
  for select using (is_axel_admin());
create policy "members see non-draft deliverables" on deliverables
  for select using (status <> 'draft' and project_org_id(project_id) in (select my_org_ids()));
create policy "axel writes deliverables" on deliverables
  for insert with check (is_axel_admin());
create policy "axel updates deliverables" on deliverables
  for update using (is_axel_admin()) with check (is_axel_admin());
create policy "axel deletes deliverables" on deliverables
  for delete using (is_axel_admin());

alter table deliverable_files enable row level security;

create policy "axel manages deliverable_files" on deliverable_files
  for all using (is_axel_admin()) with check (is_axel_admin());
create policy "members see files of visible deliverables" on deliverable_files
  for select using (
    exists (
      select 1 from deliverables d
      where d.id = deliverable_id
        and d.status <> 'draft'
        and project_org_id(d.project_id) in (select my_org_ids())
    )
  );

-- ============================================================
-- Notifications can now point at a deliverable, not only a board card
-- ============================================================

alter table notifications
  add column kind text not null default 'card' check (kind in ('card', 'deliverable'));

-- ============================================================
-- The client's one write: approve, or ask for changes
-- ============================================================

create or replace function review_deliverable(
  p_deliverable uuid,
  p_decision text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  d deliverables%rowtype;
  v_org uuid;
  v_name text;
begin
  if p_decision not in ('approved', 'changes_requested') then
    raise exception 'Invalid decision';
  end if;

  select * into d from deliverables where id = p_deliverable;
  if not found then
    raise exception 'Deliverable not found';
  end if;

  v_org := project_org_id(d.project_id);

  if my_org_role(v_org) is distinct from 'owner' then
    raise exception 'Only the workspace owner can review deliverables';
  end if;

  if d.status <> 'in_review' then
    raise exception 'This deliverable is not awaiting review';
  end if;

  if p_decision = 'changes_requested' and coalesce(btrim(p_note), '') = '' then
    raise exception 'Tell us what needs to change';
  end if;

  update deliverables
  set status = p_decision,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_note = nullif(btrim(p_note), ''),
      updated_at = now()
  where id = p_deliverable;

  select coalesce(nullif(btrim(full_name), ''), 'Your client') into v_name
  from profiles where id = auth.uid();

  insert into notifications (recipient_id, actor_id, project_id, org_id, message, kind)
  select p.id, auth.uid(), d.project_id, v_org,
         format(
           '%s %s "%s"',
           coalesce(v_name, 'Your client'),
           case when p_decision = 'approved' then 'approved' else 'requested changes on' end,
           d.title
         ),
         'deliverable'
  from profiles p
  where p.platform_role = 'axel_admin';
end;
$$;

revoke all on function review_deliverable(uuid, text, text) from public, anon;
grant execute on function review_deliverable(uuid, text, text) to authenticated;
