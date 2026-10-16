-- ============================================================
-- Nobody can make themselves the admin
-- ============================================================
--
-- "users update own profile" (0001) lets every signed-in user edit their own
-- profiles row so they can change their name. Row-Level Security works per
-- row, not per column, so that policy also let any client set
-- platform_role = 'axel_admin' on themselves through the API and, with it,
-- every admin policy in the database.
--
-- This trigger rejects a change to platform_role made with a user's token
-- unless that user already is the admin. Server-side code with the service
-- role and plain SQL (migrations, seed) carry no user token and are unaffected.

create or replace function guard_platform_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.platform_role is distinct from old.platform_role
     and coalesce(auth.role(), '') in ('authenticated', 'anon')
     and not is_axel_admin() then
    raise exception 'Only Alchemica can change platform roles';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_platform_role on profiles;
create trigger profiles_guard_platform_role
  before update on profiles
  for each row execute function guard_platform_role();
