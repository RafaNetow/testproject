-- Lets billable hours be imported straight into an invoice as line items
-- instead of retyping them. invoice_id tracks which entries have already
-- been billed so they don't show up as importable again; ON DELETE SET
-- NULL means deleting an invoice frees its hours back up rather than
-- losing the ability to bill for real work already logged.

alter table hours_entries
  add column if not exists invoice_id uuid references invoices (id) on delete set null;

-- No update policy existed on hours_entries at all — needed now to set
-- invoice_id when importing.
drop policy if exists "axel updates hours_entries" on hours_entries;
create policy "axel updates hours_entries" on hours_entries for update using (is_axel_admin());
