-- Demo workspace: everything owner@cliente.test sees beyond the basics in seed.sql.
-- Runs right after seed.sql (see [db.seed] in config.toml). Local development only.

-- A second project, so the project switcher and per-project views have something to switch to.
insert into projects (id, org_id, name, status, progress_pct, start_date, engagement_note) values
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
   'Water-resistant coating: cure schedule', 'active', 40, current_date - 6,
   'Why batch-to-batch water resistance varies on the CT-40 coating.');

insert into board_columns (id, project_id, name, position) values
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002', 'To do', 0),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000002', 'In progress', 1),
  ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000002', 'Waiting on you', 2),
  ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000002', 'Done', 3);

insert into folders (project_id, name) values
  ('20000000-0000-0000-0000-000000000002', 'Formulation Data'),
  ('20000000-0000-0000-0000-000000000002', 'Characterisation Results'),
  ('20000000-0000-0000-0000-000000000002', 'Reports'),
  ('20000000-0000-0000-0000-000000000002', 'Reference Materials');

-- More board activity (assignees, tags, links, replies).
insert into board_cards (id, column_id, project_id, title, description, tags, due_date, position, created_by) values
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
   'DSC comparison: good vs failed batches', 'Overlay the thermograms and mark the Tg shift.', '{analysis,dsc}', current_date + 5, 1,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001',
   'Confirm plasticiser supplier and lot numbers', 'We need lot numbers for the last three deliveries.', '{supplier}', current_date + 2, 1,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001',
   'Kick-off call and scope sign-off', null, '{admin}', current_date - 18, 1,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000002',
   'NMR of unreacted monomer fraction', 'Quantify residual monomer in the three worst batches.', '{nmr}', current_date + 4, 0,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000002',
   'Send cure oven logs for the last 10 runs', null, '{data}', current_date + 1, 0,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002',
   'Propose revised cure schedule', null, '{}', current_date + 12, 0,
   '00000000-0000-0000-0000-0000000000a1');

insert into board_card_assignees (card_id, profile_id) values
  ('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-0000000000c1'),
  ('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-0000000000c2'),
  ('40000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-0000000000c1'),
  ('40000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-0000000000a1');

insert into board_card_links (card_id, url, label, created_by) values
  ('40000000-0000-0000-0000-000000000002', 'https://example.com/plasticiser-migration-review', 'Plasticiser migration: literature review',
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000006', 'https://example.com/supplier-datasheet', 'Supplier datasheet',
   '00000000-0000-0000-0000-0000000000c1');

insert into board_card_comments (id, card_id, author_id, body, parent_comment_id) values
  ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-0000000000a1',
   'Lot numbers are on the delivery notes. Photos are fine.', null),
  ('60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-0000000000c2',
   'I will pull them from the warehouse on Thursday.', '60000000-0000-0000-0000-000000000001'),
  ('60000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000a1',
   'Early look: the failed batches show a Tg about 6 °C lower.', null);

-- More decisions (one with participants), meetings, updates and hours.
insert into decisions (id, project_id, title, body, source_type, decided_at, logged_by) values
  ('70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Switch to the alternative crosslinker for trial runs',
   'Two trial batches next week; compare bond strength at 7 and 14 days.', 'meeting', now() - interval '5 days',
   '00000000-0000-0000-0000-0000000000c1'),
  ('70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Share the cure oven logs before the NMR work starts',
   null, 'manual', now() - interval '3 days', '00000000-0000-0000-0000-0000000000c1');

insert into decision_participants (decision_id, participant_name) values
  ('70000000-0000-0000-0000-000000000001', 'Maja Owner'),
  ('70000000-0000-0000-0000-000000000001', 'Lars Collaborator'),
  ('70000000-0000-0000-0000-000000000001', 'Axel');

insert into meetings (project_id, title, zoom_url, scheduled_at, duration_minutes, status, notes, created_by) values
  ('20000000-0000-0000-0000-000000000001', 'Weekly check-in', 'https://zoom.us/j/000000001',
   now() - interval '6 days', 30, 'past', 'Agreed to run two trial batches with the alternative crosslinker.',
   '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000001', 'Trial batch results review', 'https://zoom.us/j/000000002',
   date_trunc('day', now()) + interval '9 days' + interval '9 hours', 45, 'upcoming', null,
   '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000002', 'Coating project kick-off', 'https://zoom.us/j/000000003',
   now() - interval '6 days', 60, 'past', 'Scope agreed; oven logs requested.', '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000002', 'NMR findings walkthrough', 'https://zoom.us/j/000000004',
   date_trunc('day', now()) + interval '6 days' + interval '13 hours', 30, 'upcoming', null,
   '00000000-0000-0000-0000-0000000000a1');

insert into weekly_updates (project_id, title, body, published_at, author_id) values
  ('20000000-0000-0000-0000-000000000001', 'Week 2 update',
   'Data package received and reviewed. FTIR shows an extra carbonyl band in batches 07 and 12.', now() - interval '9 days',
   '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000001', 'Week 1 update',
   'Kick-off complete. We have mapped the failure pattern across the last eight batches.', now() - interval '16 days',
   '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000002', 'Week 1 update',
   'Project set up. First step: the cure oven logs, so we can line cure time up against water uptake.', now() - interval '2 days',
   '00000000-0000-0000-0000-0000000000a1');

insert into hours_entries (project_id, logged_by, entry_date, hours, category, description, billable) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', current_date - 35, 6.0, 'Analysis', 'Data package review', true),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', current_date - 28, 2.5, 'Meeting', 'Kick-off', true),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', current_date - 1, 1.0, 'Report writing', 'Draft of the root-cause report', true),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', current_date - 5, 1.5, 'Meeting', 'Coating kick-off', true),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', current_date - 3, 2.0, 'Analysis', 'Oven log review', false);

-- Two more invoices so every status is represented.
insert into invoices (org_id, project_id, invoice_number, amount_cents, currency, status, due_date, issued_at,
                      line_items, vat_treatment, tax_rate_pct, discount_cents) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2026-004', 1875000, 'DKK', 'sent',
   current_date + 21, now() - interval '3 days',
   '[{"description":"Analysis and reporting","quantity":10,"unitPriceCents":100000},{"description":"Workshop","quantity":5,"unitPriceCents":100000}]',
   'domestic', 25, 0),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '2026-005', 750000, 'DKK', 'paid',
   current_date - 2, now() - interval '12 days',
   '[{"description":"Project setup","quantity":6,"unitPriceCents":100000}]', 'domestic', 25, 0);

-- Contracts in every signing state (the demo sign-in URL is a placeholder).
insert into contracts (org_id, project_id, title, contract_type, signing_status, documenso_signing_url) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Master services agreement', 'msa', 'sent',
   'https://example.com/sign/demo'),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'IP assignment', 'ip_agreement', 'partially_signed', null);

-- ============================================================
-- Deliverables
-- ============================================================
--   project 1: approved, awaiting review x2, changes requested, in progress, draft (hidden from clients)
--   project 2: awaiting review x1, in progress
-- => owner@cliente.test's sidebar shows "3" next to Deliverables.

insert into deliverables (id, project_id, title, description, status, due_date, submitted_at, reviewed_at, reviewed_by, review_note, created_by) values
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   'Data package: batches 07, 09 and 12',
   'Consolidated FTIR, DSC and formulation records for the failed batches, cleaned and cross-referenced.',
   'approved', current_date - 14, now() - interval '16 days', now() - interval '13 days',
   '00000000-0000-0000-0000-0000000000c1', null, '00000000-0000-0000-0000-0000000000a1'),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
   'Root-cause report: bond failures',
   'Written root cause for the unexplained bond failures, with the supporting spectra and our confidence in each finding.',
   'in_review', current_date + 3, now() - interval '1 day', null, null, null, '00000000-0000-0000-0000-0000000000a1'),
  ('50000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001',
   'Cure-schedule revision proposal',
   'A proposed change to the cure schedule, with the expected effect on bond strength and the risks.',
   'in_review', current_date + 6, now() - interval '2 hours', null, null, null, '00000000-0000-0000-0000-0000000000a1'),
  ('50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001',
   'Mechanism review: plasticiser migration',
   'How the plasticiser moves through the adhesive layer and why it weakens the bond over time.',
   'changes_requested', current_date - 2, now() - interval '8 days', now() - interval '4 days',
   '00000000-0000-0000-0000-0000000000c1',
   'Please add the storage temperature range you assumed, and explain the Tg shift in plain language for our QA team.',
   '00000000-0000-0000-0000-0000000000a1'),
  ('50000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001',
   'Next-experiment plan',
   'A prioritised list of the next three experiments, with what each one would settle.',
   'in_progress', current_date + 10, null, null, null, null, '00000000-0000-0000-0000-0000000000a1'),
  ('50000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001',
   'Final recommendation and roadmap',
   'Internal draft. Not visible to the client until it is ready for review.',
   'draft', current_date + 25, null, null, null, null, '00000000-0000-0000-0000-0000000000a1'),
  ('50000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002',
   'NMR findings: unreacted monomer',
   'What the NMR shows about residual monomer in the three worst batches, and what it means for the cure.',
   'in_review', current_date + 4, now() - interval '3 hours', null, null, null, '00000000-0000-0000-0000-0000000000a1'),
  ('50000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000002',
   'Revised cure schedule',
   'The cure schedule we recommend, with the oven settings and a validation plan.',
   'in_progress', current_date + 14, null, null, null, null, '00000000-0000-0000-0000-0000000000a1');

-- Notifications for the demo client (what the bell shows).
insert into notifications (recipient_id, actor_id, card_id, project_id, org_id, message, kind, read_at, created_at) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', null, '20000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001', 'Ready for your review: "NMR findings: unreacted monomer"', 'deliverable', null, now() - interval '3 hours'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', null, '20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001', 'Ready for your review: "Cure-schedule revision proposal"', 'deliverable', null, now() - interval '2 hours'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', null, '20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001', 'Ready for your review: "Root-cause report: bond failures"', 'deliverable', null, now() - interval '1 day'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', '40000000-0000-0000-0000-000000000006',
   '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'Axel (demo admin) commented on "Confirm plasticiser supplier and lot numbers"', 'card', now() - interval '1 day', now() - interval '2 days');

-- Project stages for the demo engagement: (100 + 60 + 0 + 0) / 4 = 40%.
insert into project_phases (project_id, name, position, progress_pct) values
  ('20000000-0000-0000-0000-000000000002', 'Onboarding', 0, 100),
  ('20000000-0000-0000-0000-000000000002', 'Preliminary experiments', 1, 60),
  ('20000000-0000-0000-0000-000000000002', 'Main experiments', 2, 0),
  ('20000000-0000-0000-0000-000000000002', 'Final report', 3, 0);

-- Data requests (migration 0019): what Alchemica still needs from the client.
insert into data_requests (project_id, title, details, technique, due_date, status, received_at, requested_by) values
  ('20000000-0000-0000-0000-000000000002', 'Cure-oven logs for runs 11–20',
   'Temperature and dwell time per run, as exported from the oven controller.', 'Process log', current_date + 4, 'requested', null,
   '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000002', 'Water-uptake results for panels A–F',
   'The gravimetric results after 24 h immersion, one row per panel.', null, current_date + 9, 'requested', null,
   '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000001', 'FTIR spectra for batches 7, 9 and 12',
   'Raw .csv exports, one file per batch.', 'FTIR', current_date - 6, 'received', now() - interval '5 days',
   '00000000-0000-0000-0000-0000000000a1');
