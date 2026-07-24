-- No table had a DELETE policy — Postgres RLS denies any command with no
-- matching policy, so every delete (remove member, delete client) was
-- silently blocked. Deleting a client cascades through projects into every
-- table below it, and RLS applies to cascaded deletes too, so each of those
-- tables needs its own admin-only delete policy or the cascade fails partway.

create policy "axel deletes orgs" on organizations for delete using (is_axel_admin());
create policy "axel deletes memberships" on org_memberships for delete using (is_axel_admin());
create policy "axel deletes projects" on projects for delete using (is_axel_admin());
create policy "axel deletes board columns" on board_columns for delete using (is_axel_admin());
create policy "axel deletes board cards" on board_cards for delete using (is_axel_admin());
create policy "axel deletes folders" on folders for delete using (is_axel_admin());
create policy "axel deletes files" on files for delete using (is_axel_admin());
create policy "axel deletes board card files" on board_card_files for delete using (is_axel_admin());
create policy "axel deletes decisions" on decisions for delete using (is_axel_admin());
create policy "axel deletes decision participants" on decision_participants for delete using (is_axel_admin());
create policy "axel deletes meetings" on meetings for delete using (is_axel_admin());
create policy "axel deletes feedback threads" on feedback_threads for delete using (is_axel_admin());
create policy "axel deletes feedback messages" on feedback_messages for delete using (is_axel_admin());
create policy "axel deletes invoices" on invoices for delete using (is_axel_admin());
create policy "axel deletes contracts" on contracts for delete using (is_axel_admin());
create policy "axel deletes risks" on risks for delete using (is_axel_admin());
create policy "axel deletes weekly updates" on weekly_updates for delete using (is_axel_admin());
create policy "axel deletes hours entries" on hours_entries for delete using (is_axel_admin());
create policy "axel deletes onboarding checklist items" on onboarding_checklist_items for delete using (is_axel_admin());
