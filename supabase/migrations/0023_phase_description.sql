-- ============================================================
-- Stage descriptions: what happens in each stage, in plain words
-- ============================================================
--
-- The admin writes one or two sentences per stage; the client reads them when
-- they open a stage on the timeline. Existing RLS on project_phases already
-- covers it (admin writes, members read).

alter table project_phases
  add column description text check (description is null or length(description) <= 600);
