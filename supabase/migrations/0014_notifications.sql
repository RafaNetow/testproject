-- In-app notification center. Rows are written by whoever triggers the
-- activity (comment author) targeting whoever should hear about it (the
-- card's assignees + creator), so the insert policy checks that the actor
-- is the current user rather than requiring admin/ownership of the target.

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles (id) on delete cascade,
  actor_id uuid references profiles (id),
  card_id uuid references board_cards (id) on delete cascade,
  project_id uuid references projects (id) on delete cascade,
  org_id uuid references organizations (id) on delete cascade,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on notifications (recipient_id, created_at desc);

alter table notifications enable row level security;

create policy "recipients see own notifications" on notifications
  for select using (recipient_id = auth.uid());

create policy "axel writes notifications" on notifications
  for insert with check (is_axel_admin());

create policy "members create notifications on own project" on notifications
  for insert with check (
    actor_id = auth.uid()
    and (project_id is null or project_org_id(project_id) in (select my_org_ids()))
  );

create policy "recipients update own notifications" on notifications
  for update using (recipient_id = auth.uid());
