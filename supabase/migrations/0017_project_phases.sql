-- ============================================================
-- Project phases: the stages of an engagement and how far along each is
-- ============================================================
--
-- The admin defines the stages of each project (Onboarding, Preliminary
-- experiments, …) and sets a percentage per stage; the client sees them on
-- their Executive Summary. The project's overall `progress_pct` becomes the
-- average of its phases, kept in sync by a trigger so every existing reader
-- of that column stays correct.

create table project_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  position int not null default 0,
  progress_pct int not null default 0 check (progress_pct between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index project_phases_project_idx on project_phases (project_id, position);

alter table project_phases enable row level security;

create policy "axel manages phases" on project_phases
  for all using (is_axel_admin()) with check (is_axel_admin());

create policy "members read own phases" on project_phases
  for select using (project_org_id(project_id) in (select my_org_ids()));

-- Overall progress = rounded average of the project's phases (0 with none).
create or replace function sync_project_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project uuid := coalesce(new.project_id, old.project_id);
begin
  update projects
  set progress_pct = coalesce(
    (select round(avg(progress_pct))::int from project_phases where project_id = v_project),
    0
  )
  where id = v_project;
  return null;
end;
$$;

create trigger project_phases_sync_progress
  after insert or update of progress_pct or delete on project_phases
  for each row execute function sync_project_progress();

-- Every existing project starts with the two opening stages. Its old overall
-- percentage is carried over by filling Onboarding first, so the average —
-- and what the admin already reported — stays the same.
insert into project_phases (project_id, name, position, progress_pct)
select p.id, s.name, s.position,
       case s.position
         when 0 then least(100, p.progress_pct * 2)
         else greatest(0, p.progress_pct * 2 - 100)
       end
from projects p
cross join (values ('Onboarding', 0), ('Preliminary experiments', 1)) as s (name, position)
where not exists (select 1 from project_phases ph where ph.project_id = p.id);
