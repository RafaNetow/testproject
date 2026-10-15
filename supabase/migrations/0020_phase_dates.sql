-- ============================================================
-- Stage dates, for the engagement timeline
-- ============================================================
--
-- Optional start/end dates per stage let the portal draw the engagement on
-- a calendar strip (with today's marker and upcoming meetings/deliverables).
-- Stages without dates simply stay off the timeline.

alter table project_phases
  add column start_date date,
  add column end_date date,
  add constraint project_phases_dates_ordered check (end_date is null or start_date is null or end_date >= start_date);
