-- ============================================================
-- Alchemica Assistant: per-client opt-in, audit log and rate limit
-- ============================================================
--
-- AI is off for every organisation until the admin switches it on (ideally
-- after the client agrees, under the DPA). Every question and draft is logged
-- in ai_interactions: the admin reads all of it, each user reads their own.
-- Rows are written by the server action as the signed-in user, never with the
-- service-role key, so Row-Level Security applies to the whole AI path.

alter table organizations
  add column ai_enabled boolean not null default false;

create table ai_interactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid references projects (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  kind text not null check (kind in ('ask', 'draft')),
  question text not null check (length(question) <= 2000),
  answer text not null,
  sources jsonb not null default '[]'::jsonb,
  model text,
  created_at timestamptz not null default now()
);
create index ai_interactions_user_idx on ai_interactions (user_id, created_at desc);
create index ai_interactions_org_idx on ai_interactions (org_id, created_at desc);

alter table ai_interactions enable row level security;

create policy "axel reads all ai interactions" on ai_interactions
  for select using (is_axel_admin());

create policy "users read their own ai interactions" on ai_interactions
  for select using (user_id = auth.uid());

-- A user may only log their own interactions, on a project of an organisation
-- they belong to (or any, for the admin). No update or delete policy.
create policy "users log their own ai interactions" on ai_interactions
  for insert with check (
    user_id = auth.uid()
    and (
      is_axel_admin()
      or (org_id in (select my_org_ids()) and (project_id is null or project_org_id(project_id) = org_id))
    )
  );

-- At most 30 questions per user per rolling hour.
create or replace function ai_rate_ok()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select count(*) < 30
  from ai_interactions
  where user_id = auth.uid() and created_at > now() - interval '1 hour';
$$;

revoke all on function ai_rate_ok() from public, anon;
grant execute on function ai_rate_ok() to authenticated;
