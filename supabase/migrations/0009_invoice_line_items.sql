-- Invoices only stored a single total amount — no line items, tax, or
-- discount — so there was nothing to actually render as a real invoice
-- document. amount_cents stays as the computed grand total (kept for the
-- existing list views and quick display), with the itemized breakdown
-- now stored alongside it.

alter table invoices
  add column if not exists line_items jsonb not null default '[]'::jsonb,
  add column if not exists tax_rate_pct numeric(5, 2) not null default 0,
  add column if not exists discount_cents bigint not null default 0;
