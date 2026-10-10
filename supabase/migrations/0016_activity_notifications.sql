-- ============================================================
-- Activity notifications for every action in the system
-- ============================================================
--
-- Until now only card comments and deliverable reviews notified anyone.
-- `notify_activity` fans an event out to everyone involved in the
-- engagement — the client's accepted members and the Alchemica team —
-- except whoever performed the action. It runs as security definer so a
-- client can notify the admins (whose profiles they can't read) without
-- loosening any table policy; it authorizes the caller itself instead.

alter table notifications drop constraint if exists notifications_kind_check;
alter table notifications
  add constraint notifications_kind_check check (
    kind in (
      'card', 'deliverable', 'file', 'meeting', 'decision', 'update', 'hours',
      'invoice', 'contract', 'team', 'project', 'client', 'prospect'
    )
  );

create or replace function notify_activity(
  p_kind text,
  p_message text,
  p_project uuid default null,
  p_org uuid default null,
  p_card uuid default null,
  p_admins_only boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_project uuid := p_project;
  v_org uuid := p_org;
  v_is_admin boolean := is_axel_admin();
  v_name text;
begin
  if v_actor is null then
    return;
  end if;

  if v_project is null and p_card is not null then
    select project_id into v_project from board_cards where id = p_card;
  end if;
  if v_org is null and v_project is not null then
    v_org := project_org_id(v_project);
  end if;

  -- Only people inside the engagement (or the Alchemica team) may announce
  -- activity on it; events with no client attached are admin-only.
  if not v_is_admin then
    if v_org is null or v_org not in (select my_org_ids()) then
      raise exception 'Not allowed to notify about this workspace';
    end if;
  end if;

  select coalesce(
           nullif(btrim(p.full_name), ''),
           case when v_is_admin then 'Alchemica' end,
           split_part(u.email, '@', 1),
           'Someone'
         )
    into v_name
  from auth.users u
  left join profiles p on p.id = u.id
  where u.id = v_actor;

  insert into notifications (recipient_id, actor_id, project_id, org_id, card_id, message, kind)
  select r.id, v_actor, v_project, v_org, p_card,
         format('%s %s', coalesce(v_name, 'Someone'), p_message),
         p_kind
  from (
    select id from profiles where platform_role = 'axel_admin'
    union
    select m.user_id
    from org_memberships m
    where not p_admins_only
      and v_org is not null
      and m.org_id = v_org
      and m.user_id is not null
      and m.accepted_at is not null
  ) r
  where r.id is distinct from v_actor;
end;
$$;

revoke all on function notify_activity(text, text, uuid, uuid, uuid, boolean) from public, anon;
grant execute on function notify_activity(text, text, uuid, uuid, uuid, boolean) to authenticated;

-- Push new rows to the recipient's open tab, so the bell updates live.
-- Row-Level Security still applies: each subscriber only receives their own.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table notifications;
  end if;
exception
  when duplicate_object then null;
end;
$$;
