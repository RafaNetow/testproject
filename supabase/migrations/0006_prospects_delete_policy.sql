-- prospects isn't part of the organizations/projects cascade tree (it's a
-- standalone top-of-funnel table), so it was missed by migration 0002's
-- cascade-focused delete policies. Admin needs to remove stale/duplicate
-- leads directly.

drop policy if exists "axel deletes prospects" on prospects;
create policy "axel deletes prospects" on prospects for delete using (is_axel_admin());
