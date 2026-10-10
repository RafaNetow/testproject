-- Local development seed — runs automatically on `supabase start` / `supabase db reset`.
-- Never run against a hosted project: it creates auth users directly.
--
-- Test logins (magic link — read the email at http://127.0.0.1:54324):
--   admin@alchemica.test   platform admin (/admin)
--   owner@cliente.test     client owner   (/portal, sees invoices & contracts)
--   colab@cliente.test     client collaborator (/portal, no invoices)
--
-- owner@cliente.test is the "has everything" demo user: two projects, deliverables
-- in every status (three awaiting their review), a populated board, decisions,
-- meetings, updates, hours, invoices, contracts and notifications. Real files
-- are uploaded separately by scripts/seed-files.mjs (they need actual blobs in
-- Storage), which `npm run db:start` / `db:reset` run for you.
--
-- Some rows deliberately reproduce findings from docs/AUDITORIA.md
-- (on branch audit/review-2026-10-08) so they can be checked in the UI.

-- ============================================================
-- Organization + pending invites (linked to users by handle_new_user)
-- ============================================================

insert into organizations (id, name, slug, status, cvr_number, billing_address) values
  ('10000000-0000-0000-0000-000000000001', 'Nordic Polymers ApS (demo)', 'nordic-polymers', 'active',
   'DK12345678', 'Industrivej 12, 8000 Aarhus C, Denmark');

insert into org_memberships (org_id, role, invited_email) values
  ('10000000-0000-0000-0000-000000000001', 'owner', 'owner@cliente.test'),
  ('10000000-0000-0000-0000-000000000001', 'collaborator', 'colab@cliente.test');

-- ============================================================
-- Auth users (the on_auth_user_created trigger creates profiles and
-- accepts the invites above)
-- ============================================================

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated',
   'admin@alchemica.test', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Axel (demo admin)"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000c1', 'authenticated', 'authenticated',
   'owner@cliente.test', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Maja Owner"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000c2', 'authenticated', 'authenticated',
   'colab@cliente.test', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lars Collaborator"}',
   now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u
where u.email in ('admin@alchemica.test', 'owner@cliente.test', 'colab@cliente.test');

update profiles set platform_role = 'axel_admin' where id = '00000000-0000-0000-0000-0000000000a1';

-- ============================================================
-- Project, board and folders
-- ============================================================

insert into projects (id, org_id, name, status, progress_pct, start_date, engagement_note) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'Bio-based adhesive bond failures', 'active', 61, current_date - 21,
   'Root-cause review of intermittent bond failures in the BA-200 adhesive line.');

insert into board_columns (id, project_id, name, position) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'To do', 0),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'In progress', 1),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Waiting on you', 2),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'Done', 3);

insert into board_cards (id, column_id, project_id, title, description, tags, due_date, position, created_by) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001',
   'Collect FTIR + DSC data for failed batches', 'Batches 07, 09 and 12.', '{data}', current_date - 10, 0,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
   'Mechanism review: plasticiser migration', 'Compare Tg shift against plasticiser loading.', '{analysis}', current_date + 3, 0,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001',
   'Send retained samples from batch 12', null, '{samples}', current_date + 1, 0,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   'Draft next-experiment plan', null, '{}', current_date + 10, 0,
   '00000000-0000-0000-0000-0000000000a1');

insert into board_card_assignees (card_id, profile_id) values
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000c1');

insert into board_card_comments (card_id, author_id, body) values
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000c1',
   'Samples ship Thursday — courier booked.');

insert into folders (project_id, name) values
  ('20000000-0000-0000-0000-000000000001', 'Formulation Data'),
  ('20000000-0000-0000-0000-000000000001', 'Characterisation Results'),
  ('20000000-0000-0000-0000-000000000001', 'Reports'),
  ('20000000-0000-0000-0000-000000000001', 'Reference Materials');

-- ============================================================
-- Decisions, meetings, updates, risks
-- ============================================================

insert into decisions (project_id, title, body, source_type, decided_at, logged_by) values
  ('20000000-0000-0000-0000-000000000001', 'Pause BA-200 production at line 2',
   'Until the plasticiser migration hypothesis is confirmed.', 'meeting', now() - interval '9 days',
   '00000000-0000-0000-0000-0000000000a1');

insert into meetings (project_id, title, zoom_url, scheduled_at, duration_minutes, status, created_by) values
  ('20000000-0000-0000-0000-000000000001', 'Kick-off', 'https://zoom.us/j/000000000',
   now() - interval '20 days', 60, 'past', '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000001', 'Mechanism review readout', 'https://zoom.us/j/000000000',
   date_trunc('day', now()) + interval '5 days' + interval '12 hours', 45, 'upcoming',
   '00000000-0000-0000-0000-0000000000a1');

insert into weekly_updates (project_id, title, body, published_at, author_id) values
  ('20000000-0000-0000-0000-000000000001', 'Week 3 update',
   'FTIR confirms a migrating plasticiser in batches 07 and 12. DSC next.', now() - interval '2 days',
   '00000000-0000-0000-0000-0000000000a1');

insert into risks (project_id, title, severity, status, next_action, created_by) values
  ('20000000-0000-0000-0000-000000000001', 'Retained samples may have aged', 'medium', 'open',
   'Confirm storage conditions with QA', '00000000-0000-0000-0000-0000000000a1');

-- ============================================================
-- Hours and invoices
-- ============================================================

insert into hours_entries (project_id, logged_by, entry_date, hours, category, description, billable) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', current_date - 14, 3.5, 'Analysis', 'FTIR spectra review', true),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', current_date - 7, 2.0, 'Meeting', 'Weekly sync', true),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', current_date - 2, 4.0, 'Analysis', 'DSC comparison', true);

insert into invoices (org_id, project_id, invoice_number, amount_cents, currency, status, due_date, issued_at,
                      line_items, vat_treatment, tax_rate_pct, discount_cents) values
  -- Paid, normal case.
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2026-001', 1250000, 'DKK', 'paid',
   current_date - 30, now() - interval '44 days',
   '[{"description":"Onboarding review","quantity":1,"unitPriceCents":1000000}]', 'domestic', 25, 0),
  -- Due today: shows as "Overdue" today (QA-07).
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2026-002', 625000, 'DKK', 'sent',
   current_date, now() - interval '14 days',
   '[{"description":"Mechanism review, phase 1","quantity":5,"unitPriceCents":100000}]', 'domestic', 25, 0),
  -- Draft past due: visible to the client owner as "Overdue" (QA-05).
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2026-003', 1050000, 'DKK', 'draft',
   current_date - 3, now() - interval '5 days',
   '[{"description":"Mechanism review, phase 2","quantity":10,"unitPriceCents":100000}]', 'domestic', 25, 200000);

-- ============================================================
-- Contracts, onboarding, prospects
-- ============================================================

insert into contracts (org_id, project_id, title, contract_type, signing_status) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Mutual NDA', 'nda', 'signed'),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Statement of work — phase 2', 'sow', 'draft');

insert into onboarding_checklist_items (org_id, step_key, completed_at) values
  ('10000000-0000-0000-0000-000000000001', 'agreement_sent', now() - interval '25 days'),
  ('10000000-0000-0000-0000-000000000001', 'agreement_signed', now() - interval '23 days'),
  ('10000000-0000-0000-0000-000000000001', 'kickoff_scheduled', now() - interval '22 days'),
  ('10000000-0000-0000-0000-000000000001', 'folders_created', now() - interval '21 days'),
  ('10000000-0000-0000-0000-000000000001', 'first_invoice_configured', null);

insert into prospects (company_name, contact_name, contact_email, stage, estimated_value_cents, notes) values
  ('Coastal Coatings A/S (demo)', 'Sofie Jensen', 'sofie@coastal.test', 'proposal', 4500000, 'Water-resistance inconsistency.'),
  ('BioFoam GmbH (demo)', 'Jonas Weber', 'jonas@biofoam.test', 'lead', null, null);

-- Project stages (migration 0017). The trigger derives projects.progress_pct
-- from these: (100 + 100 + 45 + 0) / 4 = 61%.
insert into project_phases (project_id, name, position, progress_pct) values
  ('20000000-0000-0000-0000-000000000001', 'Onboarding', 0, 100),
  ('20000000-0000-0000-0000-000000000001', 'Preliminary experiments', 1, 100),
  ('20000000-0000-0000-0000-000000000001', 'Root-cause analysis', 2, 45),
  ('20000000-0000-0000-0000-000000000001', 'Final report', 3, 0);
