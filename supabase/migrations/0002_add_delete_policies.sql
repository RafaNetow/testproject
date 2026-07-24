-- No table had a DELETE policy — Postgres RLS denies any command with no
-- matching policy, so every delete (remove member, delete client) was
-- silently blocked. Deleting a client cascades through projects into every
-- table below it, and RLS applies to cascaded deletes too, so each of those
-- tables needs its own admin-only delete policy or the cascade fails partway.
--
-- Each policy is dropped first so this file is safe to run more than once
-- (e.g. after a partial run stopped partway through with an error).

drop policy if exists "axel deletes orgs" on organizations;
create policy "axel deletes orgs" on organizations for delete using (is_axel_admin());

drop policy if exists "axel deletes memberships" on org_memberships;
create policy "axel deletes memberships" on org_memberships for delete using (is_axel_admin());

drop policy if exists "axel deletes projects" on projects;
create policy "axel deletes projects" on projects for delete using (is_axel_admin());

drop policy if exists "axel deletes board columns" on board_columns;
create policy "axel deletes board columns" on board_columns for delete using (is_axel_admin());

drop policy if exists "axel deletes board cards" on board_cards;
create policy "axel deletes board cards" on board_cards for delete using (is_axel_admin());

drop policy if exists "axel deletes folders" on folders;
create policy "axel deletes folders" on folders for delete using (is_axel_admin());

drop policy if exists "axel deletes files" on files;
create policy "axel deletes files" on files for delete using (is_axel_admin());

drop policy if exists "axel deletes board card files" on board_card_files;
create policy "axel deletes board card files" on board_card_files for delete using (is_axel_admin());

drop policy if exists "axel deletes decisions" on decisions;
create policy "axel deletes decisions" on decisions for delete using (is_axel_admin());

drop policy if exists "axel deletes decision participants" on decision_participants;
create policy "axel deletes decision participants" on decision_participants for delete using (is_axel_admin());

drop policy if exists "axel deletes meetings" on meetings;
create policy "axel deletes meetings" on meetings for delete using (is_axel_admin());

drop policy if exists "axel deletes feedback threads" on feedback_threads;
create policy "axel deletes feedback threads" on feedback_threads for delete using (is_axel_admin());

drop policy if exists "axel deletes feedback messages" on feedback_messages;
create policy "axel deletes feedback messages" on feedback_messages for delete using (is_axel_admin());

drop policy if exists "axel deletes invoices" on invoices;
create policy "axel deletes invoices" on invoices for delete using (is_axel_admin());

drop policy if exists "axel deletes contracts" on contracts;
create policy "axel deletes contracts" on contracts for delete using (is_axel_admin());

drop policy if exists "axel deletes risks" on risks;
create policy "axel deletes risks" on risks for delete using (is_axel_admin());

drop policy if exists "axel deletes weekly updates" on weekly_updates;
create policy "axel deletes weekly updates" on weekly_updates for delete using (is_axel_admin());

drop policy if exists "axel deletes hours entries" on hours_entries;
create policy "axel deletes hours entries" on hours_entries for delete using (is_axel_admin());

drop policy if exists "axel deletes onboarding checklist items" on onboarding_checklist_items;
create policy "axel deletes onboarding checklist items" on onboarding_checklist_items for delete using (is_axel_admin());
