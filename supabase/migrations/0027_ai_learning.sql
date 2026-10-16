-- ============================================================
-- The assistant learns from Axel (admin only)
-- ============================================================
--
-- Three things feed Axel's copilot, none of them visible to clients and none
-- used by the client-facing assistant:
--   1. His corrections: for each AI draft we keep the message he finally sent.
--   2. His rules: one editable text the copilot always reads.
--   3. A case book: anonymised write-ups of finished projects, searched for
--      similar problems when drafting.

alter table ai_interactions add column final_text text;

-- Remember what Axel actually sent after using "Suggest reply". Clients have no
-- update policy on ai_interactions, so this goes through a function that only
-- the admin can use, and only touches the caller's own latest open draft.
create or replace function record_draft_final(p_project uuid, p_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not is_axel_admin() then
    return;
  end if;

  select id into v_id
  from ai_interactions
  where user_id = auth.uid()
    and project_id = p_project
    and kind = 'draft'
    and final_text is null
    and created_at > now() - interval '6 hours'
  order by created_at desc
  limit 1;

  if v_id is not null then
    update ai_interactions set final_text = left(p_text, 4000) where id = v_id;
  end if;
end;
$$;

revoke all on function record_draft_final(uuid, text) from public, anon;
grant execute on function record_draft_final(uuid, text) to authenticated;

create table ai_rules (
  id int primary key default 1 check (id = 1),
  body text not null default '' check (length(body) <= 6000),
  updated_by uuid references profiles (id),
  updated_at timestamptz not null default now()
);
insert into ai_rules (id, body) values (1, '') on conflict do nothing;

alter table ai_rules enable row level security;
create policy "axel reads ai rules" on ai_rules for select using (is_axel_admin());
create policy "axel writes ai rules" on ai_rules for update using (is_axel_admin()) with check (is_axel_admin());

create table case_studies (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 160),
  problem text not null default '',
  findings text not null default '',
  outcome text not null default '',
  tags text[] not null default '{}',
  source_project_id uuid references projects (id) on delete set null,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

alter table case_studies enable row level security;
create policy "axel manages case studies" on case_studies
  for all using (is_axel_admin()) with check (is_axel_admin());
