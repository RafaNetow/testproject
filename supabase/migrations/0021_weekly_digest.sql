-- ============================================================
-- Weekly email digest preference
-- ============================================================
--
-- Clients get a Monday summary of their engagement unless they opt out.
-- The preference is changed through set_weekly_digest() rather than a
-- direct profiles UPDATE, so this feature doesn't lean on the broad
-- "users update own profile" policy (see docs/AUDITORIA.md).

alter table profiles add column weekly_digest boolean not null default true;

create or replace function set_weekly_digest(p_enabled boolean)
returns void
language sql
security definer
set search_path = public
as $$
  update profiles set weekly_digest = p_enabled where id = auth.uid();
$$;

revoke all on function set_weekly_digest(boolean) from public, anon;
grant execute on function set_weekly_digest(boolean) to authenticated;
