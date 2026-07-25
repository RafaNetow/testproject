-- Danish/EU VAT compliance: organizations need a CVR number (and billing
-- address, also legally required on an invoice) so clients can register it
-- themselves; invoices need to record which VAT treatment applies
-- (domestic 25%, EU reverse charge 0%, or outside-EU 0%) and the buyer's
-- VAT number for the reverse-charge case.

alter table organizations
  add column if not exists cvr_number text,
  add column if not exists billing_address text;

-- No update policy existed for organizations at all beyond axel — clients
-- had no way to edit even their own org's details. Row-level, not
-- column-level, so the app layer (not RLS) is what limits this to the
-- CVR/billing-address fields specifically for the client-facing path.
drop policy if exists "owners update own org" on organizations;
create policy "owners update own org" on organizations
  for update using (my_org_role(id) = 'owner') with check (my_org_role(id) = 'owner');

alter table invoices
  add column if not exists vat_treatment text not null default 'domestic'
    check (vat_treatment in ('domestic', 'eu_reverse_charge', 'outside_eu')),
  add column if not exists buyer_vat_number text;
