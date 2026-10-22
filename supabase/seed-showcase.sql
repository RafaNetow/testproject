-- Showcase: three more demo engagements, so the portal looks like a real practice.
-- Runs after seed.sql and seed-demo.sql (see [db.seed] in config.toml). Local development only.
--
--   A  Nordic Polymers ApS (demo)  · "Adhesion on recycled PET film"      just started   (owner@cliente.test sees it)
--   B  Fjordline Packaging A/S     · "Odour from recycled HDPE bottles"   halfway        owner@fjordline.test
--   C  Baltic BioCoat ApS          · "Shelf-life of a bio-based varnish"  nearly done    owner@balticbiocoat.test
--
-- Safe to run again on a running local stack (it rebuilds its own rows):
--   docker exec -i supabase_db_alchemica psql -U postgres < supabase/seed-showcase.sql

-- Start clean: deleting the orgs and project cascades to everything under them.
delete from projects where id = '20000000-0000-0000-0000-000000000003';
delete from organizations where id in ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003');
delete from auth.users where id in ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000c4');

-- ============================================================
-- Clients and their logins (invites first: the new-user trigger accepts them)
-- ============================================================

insert into organizations (id, name, slug, status, cvr_number, billing_address) values
  ('10000000-0000-0000-0000-000000000002', 'Fjordline Packaging A/S (demo)', 'fjordline-packaging', 'active',
   'DK23456789', 'Havnegade 4, 6700 Esbjerg, Denmark'),
  ('10000000-0000-0000-0000-000000000003', 'Baltic BioCoat ApS (demo)', 'baltic-biocoat', 'active',
   'DK34567890', 'Kystvejen 22, 4700 Næstved, Denmark');

insert into org_memberships (org_id, role, invited_email) values
  ('10000000-0000-0000-0000-000000000002', 'owner', 'owner@fjordline.test'),
  ('10000000-0000-0000-0000-000000000003', 'owner', 'owner@balticbiocoat.test');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000c3', 'authenticated', 'authenticated',
   'owner@fjordline.test', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Henrik Dahl"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000c4', 'authenticated', 'authenticated',
   'owner@balticbiocoat.test', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ieva Ozola"}',
   now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u
where u.id in ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000c4');

insert into onboarding_checklist_items (org_id, step_key, completed_at) values
  ('10000000-0000-0000-0000-000000000002', 'agreement_sent', now() - interval '30 days'),
  ('10000000-0000-0000-0000-000000000002', 'agreement_signed', now() - interval '28 days'),
  ('10000000-0000-0000-0000-000000000002', 'kickoff_scheduled', now() - interval '27 days'),
  ('10000000-0000-0000-0000-000000000002', 'folders_created', now() - interval '25 days'),
  ('10000000-0000-0000-0000-000000000002', 'first_invoice_configured', now() - interval '20 days'),
  ('10000000-0000-0000-0000-000000000003', 'agreement_sent', now() - interval '55 days'),
  ('10000000-0000-0000-0000-000000000003', 'agreement_signed', now() - interval '53 days'),
  ('10000000-0000-0000-0000-000000000003', 'kickoff_scheduled', now() - interval '52 days'),
  ('10000000-0000-0000-0000-000000000003', 'folders_created', now() - interval '50 days'),
  ('10000000-0000-0000-0000-000000000003', 'first_invoice_configured', now() - interval '45 days');

-- ============================================================
-- Projects, boards, folders
-- ============================================================

insert into projects (id, org_id, name, status, progress_pct, start_date, engagement_note) values
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
   'Adhesion on recycled PET film', 'active', 0, current_date - 3,
   'Why the PU laminating adhesive lets go on film with more than 30 % recycled PET.'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002',
   'Odour from recycled HDPE bottles', 'active', 0, current_date - 25,
   'Find and remove the source of the musty off-odour in bottles made with post-consumer HDPE.'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003',
   'Shelf-life of a bio-based varnish', 'active', 0, current_date - 50,
   'Prove a 24-month shelf-life for the BV-7 bio-based wood varnish before launch.');

insert into board_columns (id, project_id, name, position) values
  ('30000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000003', 'To do', 0),
  ('30000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000003', 'In progress', 1),
  ('30000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000003', 'Waiting on you', 2),
  ('30000000-0000-0000-0000-000000000024', '20000000-0000-0000-0000-000000000003', 'Done', 3),
  ('30000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000004', 'To do', 0),
  ('30000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000004', 'In progress', 1),
  ('30000000-0000-0000-0000-000000000033', '20000000-0000-0000-0000-000000000004', 'Waiting on you', 2),
  ('30000000-0000-0000-0000-000000000034', '20000000-0000-0000-0000-000000000004', 'Done', 3),
  ('30000000-0000-0000-0000-000000000041', '20000000-0000-0000-0000-000000000005', 'To do', 0),
  ('30000000-0000-0000-0000-000000000042', '20000000-0000-0000-0000-000000000005', 'In progress', 1),
  ('30000000-0000-0000-0000-000000000043', '20000000-0000-0000-0000-000000000005', 'Waiting on you', 2),
  ('30000000-0000-0000-0000-000000000044', '20000000-0000-0000-0000-000000000005', 'Done', 3);

insert into board_cards (id, column_id, project_id, title, description, tags, due_date, position, created_by) values
  -- A: just started
  ('40000000-0000-0000-0000-000000000101', '30000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000003',
   'Map peel-strength results by rPET content', 'Line up the T-peel data against 0, 15, 30 and 50 % rPET.', '{analysis}', current_date + 4, 0,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000003',
   'Send film samples from the last three rolls', 'A4 sheets, wrapped in foil, labelled with roll number.', '{samples}', current_date + 3, 0,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000103', '30000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000003',
   'Plan contact-angle and XPS measurements', null, '{surface}', current_date + 9, 0,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000104', '30000000-0000-0000-0000-000000000024', '20000000-0000-0000-0000-000000000003',
   'Scope call and workspace set-up', null, '{}', current_date - 2, 0,
   '00000000-0000-0000-0000-0000000000a1'),
  -- B: halfway
  ('40000000-0000-0000-0000-000000000111', '30000000-0000-0000-0000-000000000034', '20000000-0000-0000-0000-000000000004',
   'GC-MS headspace on good vs smelly bottles', 'Twelve bottles each, 80 °C headspace.', '{gc-ms,analysis}', current_date - 8, 0,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000112', '30000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000004',
   'Trace 2-methylisoborneol back to the flake supplier', 'Compare the three flake lots received in August.', '{analysis}', current_date + 5, 0,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000113', '30000000-0000-0000-0000-000000000033', '20000000-0000-0000-0000-000000000004',
   'Share wash-line water temperatures for September', null, '{process}', current_date + 2, 0,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000114', '30000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000004',
   'Test a hot-wash trial at 85 °C', null, '{trial}', current_date + 12, 0,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000115', '30000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000004',
   'Sensory panel with five trained noses', 'Blind triangle test on washed vs unwashed flake.', '{sensory}', current_date + 7, 1,
   '00000000-0000-0000-0000-0000000000a1'),
  -- C: nearly done
  ('40000000-0000-0000-0000-000000000121', '30000000-0000-0000-0000-000000000044', '20000000-0000-0000-0000-000000000005',
   'Accelerated ageing at 40 °C / 75 % RH, 12 weeks', null, '{ageing}', current_date - 20, 0,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000122', '30000000-0000-0000-0000-000000000044', '20000000-0000-0000-0000-000000000005',
   'Viscosity and gloss after ageing', null, '{analysis}', current_date - 12, 1,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000123', '30000000-0000-0000-0000-000000000042', '20000000-0000-0000-0000-000000000005',
   'Write the shelf-life statement for the TDS', 'Wording for the technical data sheet, with the test basis.', '{report}', current_date + 4, 0,
   '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000124', '30000000-0000-0000-0000-000000000043', '20000000-0000-0000-0000-000000000005',
   'Approve the final report', null, '{review}', current_date + 6, 0,
   '00000000-0000-0000-0000-0000000000a1');

insert into board_card_assignees (card_id, profile_id) values
  ('40000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-0000000000c1'),
  ('40000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-0000000000a1'),
  ('40000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-0000000000c3'),
  ('40000000-0000-0000-0000-000000000124', '00000000-0000-0000-0000-0000000000c4');

insert into folders (project_id, name)
select p.id, f.name
from (values ('20000000-0000-0000-0000-000000000003'::uuid), ('20000000-0000-0000-0000-000000000004'::uuid), ('20000000-0000-0000-0000-000000000005'::uuid)) as p (id),
     (values ('Formulation Data'), ('Characterisation Results'), ('Reports'), ('Reference Materials')) as f (name);

-- ============================================================
-- Stages: dates relative to each project's start, and what happens in each
-- (the trigger derives projects.progress_pct from these)
-- ============================================================

insert into project_phases (project_id, name, position, progress_pct, start_date, end_date, description)
select p.id, s.name, s.position, s.pct, p.start_date + s.s, p.start_date + s.e, s.description
from projects p
join (values
  ('20000000-0000-0000-0000-000000000003'::uuid, 'Onboarding', 0, 40, 0, 6,
   'We agree the scope, collect the peel-test history and set up this workspace.'),
  ('20000000-0000-0000-0000-000000000003'::uuid, 'Surface analysis', 1, 0, 7, 20,
   'Contact angle and XPS on virgin and recycled film, to see what is on the surface the adhesive meets.'),
  ('20000000-0000-0000-0000-000000000003'::uuid, 'Adhesion trials', 2, 0, 21, 40,
   'Small lamination trials with corona and primer options, measured by T-peel.'),
  ('20000000-0000-0000-0000-000000000003'::uuid, 'Final report', 3, 0, 41, 48,
   'The cause, the fix that worked best and the settings for your line.'),
  ('20000000-0000-0000-0000-000000000004'::uuid, 'Onboarding', 0, 100, 0, 4,
   'We agree the scope and collect complaint samples and your flake supplier records.'),
  ('20000000-0000-0000-0000-000000000004'::uuid, 'Odour profiling', 1, 100, 5, 20,
   'GC-MS and a trained sensory panel find which compound people actually smell.'),
  ('20000000-0000-0000-0000-000000000004'::uuid, 'Source tracing', 2, 50, 21, 38,
   'We follow that compound back through washing and extrusion to where it comes in.'),
  ('20000000-0000-0000-0000-000000000004'::uuid, 'Final report', 3, 0, 39, 46,
   'What causes the odour and a washing or sourcing change that removes it.'),
  ('20000000-0000-0000-0000-000000000005'::uuid, 'Onboarding', 0, 100, 0, 5,
   'We agree the claim you want to make and collect the formulation and raw-material data.'),
  ('20000000-0000-0000-0000-000000000005'::uuid, 'Accelerated ageing', 1, 100, 6, 30,
   'Samples age in climate chambers so 12 weeks stand in for two years on the shelf.'),
  ('20000000-0000-0000-0000-000000000005'::uuid, 'Real-time check', 2, 100, 31, 48,
   'We compare the chamber results with samples stored at room temperature.'),
  ('20000000-0000-0000-0000-000000000005'::uuid, 'Final report', 3, 70, 49, 56,
   'A shelf-life statement you can print on the data sheet, with the evidence behind it.')
) as s (project_id, name, position, pct, s, e, description) on s.project_id = p.id;

-- ============================================================
-- Deliverables (A: one in progress · B: approved + awaiting review · C: approved x2 + final in review)
-- ============================================================

insert into deliverables (id, project_id, title, description, status, due_date, submitted_at, reviewed_at, reviewed_by, review_note, created_by) values
  ('50000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000003',
   'Surface analysis summary', 'What is on the recycled film surface and how it differs from virgin film.',
   'in_progress', current_date + 18, null, null, null, null, '00000000-0000-0000-0000-0000000000a1'),
  ('50000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000004',
   'Odour profile: GC-MS and sensory results', 'The compounds found, which ones people smell, and at what level.',
   'approved', current_date - 6, now() - interval '9 days', now() - interval '6 days',
   '00000000-0000-0000-0000-0000000000c3', null, '00000000-0000-0000-0000-0000000000a1'),
  ('50000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000004',
   'Interim note: 2-MIB traced to flake lot 0824', 'Why we think one flake lot brings the odour in, and how to confirm it.',
   'in_review', current_date + 2, now() - interval '5 hours', null, null, null, '00000000-0000-0000-0000-0000000000a1'),
  ('50000000-0000-0000-0000-000000000033', '20000000-0000-0000-0000-000000000004',
   'Washing-line recommendation', 'Settings for the hot-wash step that remove the odour.',
   'in_progress', current_date + 16, null, null, null, null, '00000000-0000-0000-0000-0000000000a1'),
  ('50000000-0000-0000-0000-000000000041', '20000000-0000-0000-0000-000000000005',
   'Ageing protocol', 'Chamber conditions, sampling points and pass criteria.',
   'approved', current_date - 44, now() - interval '46 days', now() - interval '44 days',
   '00000000-0000-0000-0000-0000000000c4', null, '00000000-0000-0000-0000-0000000000a1'),
  ('50000000-0000-0000-0000-000000000042', '20000000-0000-0000-0000-000000000005',
   'Twelve-week ageing results', 'Viscosity, gloss and film defects at every sampling point.',
   'approved', current_date - 10, now() - interval '14 days', now() - interval '10 days',
   '00000000-0000-0000-0000-0000000000c4', null, '00000000-0000-0000-0000-0000000000a1'),
  ('50000000-0000-0000-0000-000000000043', '20000000-0000-0000-0000-000000000005',
   'Final report: 24-month shelf-life statement', 'The claim, the evidence, and the wording for the data sheet.',
   'in_review', current_date + 6, now() - interval '1 day', null, null, null, '00000000-0000-0000-0000-0000000000a1');

-- ============================================================
-- Data requests
-- ============================================================

insert into data_requests (project_id, title, details, technique, due_date, status, received_at, requested_by) values
  ('20000000-0000-0000-0000-000000000003', 'T-peel results for the last six months',
   'One row per roll: rPET %, peel force, failure mode.', 'Peel test', current_date + 5, 'requested', null, '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000003', 'Adhesive and primer data sheets',
   'The current PU adhesive and any primer you have tried.', null, current_date + 2, 'requested', null, '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000004', 'Wash-line water temperature logs, September',
   'Export from the wash-line controller, hourly is fine.', 'Process log', current_date + 2, 'requested', null, '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000004', 'Complaint bottles from customers',
   'Ten bottles, sealed in the bags we sent.', null, current_date - 18, 'received', now() - interval '17 days', '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000005', 'Raw-material certificates for BV-7',
   'Certificates of analysis for the resin and the drier.', null, current_date - 45, 'received', now() - interval '44 days', '00000000-0000-0000-0000-0000000000a1');

-- ============================================================
-- Meetings (spread over this month and next, so the calendar fills up)
-- ============================================================

insert into meetings (project_id, title, zoom_url, scheduled_at, duration_minutes, status, notes, created_by) values
  ('20000000-0000-0000-0000-000000000003', 'Scope call', 'https://zoom.us/j/000000011',
   date_trunc('day', now()) - interval '3 days' + interval '9 hours', 45, 'past', 'Scope agreed; peel data and film samples requested.', '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000003', 'Kick-off with the lamination team', 'https://zoom.us/j/000000012',
   date_trunc('day', now()) + interval '6 days' + interval '8 hours 30 minutes', 60, 'upcoming', null, '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000004', 'Odour profile readout', 'https://zoom.us/j/000000021',
   date_trunc('day', now()) - interval '8 days' + interval '11 hours', 45, 'past', 'Panel agrees the off-odour is 2-MIB; trace the flake lots next.', '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000004', 'Weekly check-in', 'https://zoom.us/j/000000022',
   date_trunc('day', now()) + interval '1 day' + interval '10 hours', 30, 'upcoming', null, '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000004', 'Hot-wash trial review', 'https://zoom.us/j/000000023',
   date_trunc('day', now()) + interval '15 days' + interval '13 hours', 45, 'upcoming', null, '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000005', 'Ageing results walkthrough', 'https://zoom.us/j/000000031',
   date_trunc('day', now()) - interval '10 days' + interval '14 hours', 45, 'past', 'All sampling points within spec; final report next.', '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000005', 'Final report presentation', 'https://zoom.us/j/000000032',
   date_trunc('day', now()) + interval '7 days' + interval '9 hours', 60, 'upcoming', null, '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000005', 'Launch support call', 'https://zoom.us/j/000000033',
   date_trunc('day', now()) + interval '24 days' + interval '10 hours', 30, 'upcoming', null, '00000000-0000-0000-0000-0000000000a1');

-- ============================================================
-- Decisions, updates, hours
-- ============================================================

insert into decisions (project_id, title, body, source_type, decided_at, logged_by) values
  ('20000000-0000-0000-0000-000000000003', 'Test 30 % rPET film first',
   'It is the lowest content where failures start, so it shows the effect most clearly.', 'meeting', now() - interval '3 days', '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000004', 'Hold flake lot 0824 until the trace is confirmed',
   'Use lots 0821 and 0830 in production meanwhile.', 'meeting', now() - interval '8 days', '00000000-0000-0000-0000-0000000000c3'),
  ('20000000-0000-0000-0000-000000000005', 'Claim 24 months, not 30',
   'The real-time data supports 24 months with margin; 30 would need another year of storage.', 'meeting', now() - interval '10 days', '00000000-0000-0000-0000-0000000000a1');

insert into weekly_updates (project_id, title, body, published_at, author_id) values
  ('20000000-0000-0000-0000-000000000003', 'Week 1 update',
   'Scope agreed. We are waiting for the peel-test history and film samples to start the surface work.', now() - interval '1 day', '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000004', 'Week 4 update',
   'The odour is 2-MIB. It is present in flake lot 0824 at ten times the other lots. Hot-wash trial planned.', now() - interval '2 days', '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-000000000005', 'Week 7 update',
   'Ageing finished and every point passed. The final report is with Ieva for review.', now() - interval '1 day', '00000000-0000-0000-0000-0000000000a1');

insert into hours_entries (project_id, logged_by, entry_date, hours, category, description, billable) values
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', current_date - 3, 1.5, 'Meeting', 'Scope call', true),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', current_date - 1, 2.0, 'Analysis', 'Peel-data review plan', true),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000a1', current_date - 20, 5.0, 'Analysis', 'GC-MS headspace', true),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000a1', current_date - 9, 3.0, 'Report writing', 'Odour profile write-up', true),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000a1', current_date - 2, 2.5, 'Analysis', 'Flake lot comparison', true),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000a1', current_date - 30, 4.0, 'Analysis', 'Six-week sampling', true),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000a1', current_date - 12, 4.5, 'Analysis', 'Twelve-week sampling', true),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000a1', current_date - 2, 6.0, 'Report writing', 'Final report', true);

-- ============================================================
-- Invoices and contracts
-- ============================================================

insert into invoices (org_id, project_id, invoice_number, amount_cents, currency, status, due_date, issued_at,
                      line_items, vat_treatment, tax_rate_pct, discount_cents) values
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', '2026-101', 900000, 'DKK', 'paid',
   current_date - 10, now() - interval '24 days',
   '[{"description":"Odour profiling (GC-MS + sensory panel)","quantity":9,"unitPriceCents":100000}]', 'domestic', 25, 0),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', '2026-102', 600000, 'DKK', 'sent',
   current_date + 14, now() - interval '1 day',
   '[{"description":"Source tracing, first half","quantity":6,"unitPriceCents":100000}]', 'domestic', 25, 0),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', '2026-201', 1500000, 'DKK', 'paid',
   current_date - 25, now() - interval '39 days',
   '[{"description":"Accelerated ageing programme","quantity":15,"unitPriceCents":100000}]', 'domestic', 25, 0),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', '2026-202', 800000, 'DKK', 'sent',
   current_date + 9, now() - interval '5 days',
   '[{"description":"Real-time check and final report","quantity":8,"unitPriceCents":100000}]', 'domestic', 25, 0);

insert into contracts (org_id, project_id, title, contract_type, signing_status) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Statement of work — PET film adhesion', 'sow', 'draft'),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 'Mutual NDA', 'nda', 'signed'),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 'Statement of work — odour investigation', 'sow', 'signed'),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', 'Master services agreement', 'msa', 'signed');

-- ============================================================
-- Chat threads
-- ============================================================

insert into messages (project_id, author_id, body, created_at) values
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1',
   'Welcome to the PET film project, Maja. The two data requests in Files are all we need to get going.', now() - interval '2 days'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000c3',
   'Hi Axel, our customer asked again about the smell. Is it safe to keep shipping from the other flake lots?', now() - interval '1 day 4 hours'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000a1',
   E'Yes. Lots 0821 and 0830 test clean.\nKeep 0824 on hold until the hot-wash trial; I have put the interim note in Deliverables for you.', now() - interval '1 day 2 hours'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000c3',
   'Perfect, thanks. I will share the wash-line logs tomorrow.', now() - interval '1 day 1 hour'),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000a1',
   'Ieva, the final report is ready for your review. The meeting next week is to go through the wording for the data sheet.', now() - interval '1 day'),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000c4',
   'Great news. I will read it before the meeting.', now() - interval '20 hours');

-- Notifications for the new clients (what the bell shows).
insert into notifications (recipient_id, actor_id, card_id, project_id, org_id, message, kind, read_at, created_at) values
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000a1', null, '20000000-0000-0000-0000-000000000004',
   '10000000-0000-0000-0000-000000000002', 'Ready for your review: "Interim note: 2-MIB traced to flake lot 0824"', 'deliverable', null, now() - interval '5 hours'),
  ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-0000000000a1', null, '20000000-0000-0000-0000-000000000005',
   '10000000-0000-0000-0000-000000000003', 'Ready for your review: "Final report: 24-month shelf-life statement"', 'deliverable', null, now() - interval '1 day');
