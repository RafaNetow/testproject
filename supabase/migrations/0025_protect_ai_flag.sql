-- ============================================================
-- Only the admin may switch the AI assistant on or off
-- ============================================================
--
-- "owners update own org" (0010) lets a client owner edit their organisation
-- row so they can keep their billing details current. Row-Level Security works
-- per row, not per column, so that policy would also let an owner flip
-- ai_enabled and switch the assistant on without Alchemica's consent. This
-- trigger rejects any change to ai_enabled unless the caller is the admin.

create or replace function guard_org_ai_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.ai_enabled is distinct from old.ai_enabled and not is_axel_admin() then
    raise exception 'Only Alchemica can change the AI assistant setting';
  end if;
  return new;
end;
$$;

drop trigger if exists organizations_guard_ai_flag on organizations;
create trigger organizations_guard_ai_flag
  before update on organizations
  for each row execute function guard_org_ai_flag();
