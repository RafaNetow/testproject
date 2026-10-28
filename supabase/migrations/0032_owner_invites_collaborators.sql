-- Client owners can invite collaborators from their portal Team page. The
-- original policy (0001_init) only checked that the inserter owns the org,
-- so an owner could also have inserted another owner, or a row pre-linked
-- to an existing account (user_id / accepted_at set by hand). An invite from
-- an owner is now only ever a pending collaborator, keyed by email; the
-- handle_new_user trigger links it when that email signs in.
drop policy if exists "owners invite within their org" on org_memberships;
create policy "owners invite within their org" on org_memberships for insert with check (
  my_org_role(org_id) = 'owner'
  and role = 'collaborator'
  and user_id is null
  and accepted_at is null
);
