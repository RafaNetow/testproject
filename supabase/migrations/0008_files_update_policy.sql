-- Moving a file between folders is an UPDATE on files.folder_id, but no
-- update policy existed on files at all (only insert/delete) — the same
-- class of gap as the earlier missing-delete-policy bug. Admin-only,
-- matching how folders themselves are managed.

drop policy if exists "axel updates files" on files;
create policy "axel updates files" on files for update using (is_axel_admin());
