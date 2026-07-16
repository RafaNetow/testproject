-- Alchemica portal — initial schema + Row-Level Security
-- See /Users/axelrosenvinge/.claude/plans/encapsulated-mixing-dragon.md for the full design rationale.
--
-- Security model in one sentence: a client can only ever see rows whose org_id
-- (directly, or transitively through projects) matches an org_membership they
-- hold; profiles.platform_role = 'axel_admin' bypasses every check below.

create extension if not exists pgcrypto;

-- ============================================================
-- Tables
-- ============================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  platform_role text not null default 'none' check (platform_role in ('none', 'axel_admin')),
  tour_completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  status text not null default 'onboarding' check (status in ('onboarding', 'active', 'at_risk', 'offboarded')),
  created_at timestamptz not null default now()
);

create table org_memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  user_id uuid references profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'collaborator')),
  invited_email text,
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  unique (org_id, user_id)
);
create index org_memberships_user_idx on org_memberships (user_id);
create index org_memberships_invited_email_idx on org_memberships (invited_email);

create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  progress_pct int not null default 0 check (progress_pct between 0 and 100),
  start_date date,
  engagement_note text,
  created_at timestamptz not null default now()
);
create index projects_org_idx on projects (org_id);

create table board_columns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  position int not null default 0
);
create index board_columns_project_idx on board_columns (project_id);

create table board_cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references board_columns (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  tags text[] not null default '{}',
  due_date date,
  assignee_id uuid references profiles (id),
  position int not null default 0,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index board_cards_project_idx on board_cards (project_id);
create index board_cards_column_idx on board_cards (column_id);

create table folders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  parent_folder_id uuid references folders (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index folders_project_idx on folders (project_id);

create table files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  folder_id uuid references folders (id) on delete set null,
  storage_path text not null,
  filename text not null,
  size_bytes bigint not null,
  mime_type text,
  version_tag text,
  parent_file_id uuid references files (id) on delete set null,
  uploaded_by uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index files_project_idx on files (project_id);
create index files_folder_idx on files (folder_id);

create table board_card_files (
  card_id uuid not null references board_cards (id) on delete cascade,
  file_id uuid not null references files (id) on delete cascade,
  primary key (card_id, file_id)
);

create table decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  body text,
  source_type text check (source_type in ('meeting', 'board_card', 'manual')),
  source_meeting_id uuid,
  source_card_id uuid references board_cards (id),
  decided_at timestamptz not null default now(),
  logged_by uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index decisions_project_idx on decisions (project_id);

create table decision_participants (
  decision_id uuid not null references decisions (id) on delete cascade,
  profile_id uuid references profiles (id),
  participant_name text not null,
  participant_email text,
  primary key (decision_id, participant_name)
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  zoom_url text,
  scheduled_at timestamptz not null,
  duration_minutes int,
  status text not null default 'upcoming' check (status in ('upcoming', 'past', 'cancelled')),
  notes text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index meetings_project_idx on meetings (project_id);

create table feedback_threads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index feedback_threads_project_idx on feedback_threads (project_id);

create table feedback_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references feedback_threads (id) on delete cascade,
  author_id uuid references profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);
create index feedback_messages_thread_idx on feedback_messages (thread_id);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  invoice_number text not null,
  amount_cents bigint not null,
  currency text not null default 'DKK',
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue')),
  due_date date,
  pdf_storage_path text,
  issued_at timestamptz,
  created_at timestamptz not null default now()
);
create index invoices_org_idx on invoices (org_id);
create index invoices_project_idx on invoices (project_id);

create table contracts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid references projects (id) on delete cascade,
  title text not null,
  contract_type text not null check (contract_type in ('msa', 'nda', 'ip_agreement', 'sow')),
  documenso_document_id text,
  signing_status text not null default 'draft' check (signing_status in ('draft', 'sent', 'partially_signed', 'signed')),
  signed_pdf_storage_path text,
  created_at timestamptz not null default now()
);
create index contracts_org_idx on contracts (org_id);

create table risks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  description text,
  severity text not null check (severity in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'mitigated', 'closed')),
  next_action text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index risks_project_idx on risks (project_id);

create table weekly_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  body text not null,
  published_at timestamptz not null default now(),
  author_id uuid references profiles (id)
);
create index weekly_updates_project_idx on weekly_updates (project_id);

create table hours_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  logged_by uuid references profiles (id),
  entry_date date not null,
  hours numeric(5, 2) not null,
  category text,
  description text,
  billable boolean not null default true,
  created_at timestamptz not null default now()
);
create index hours_entries_project_idx on hours_entries (project_id);

create table prospects (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_email text,
  stage text not null default 'lead' check (stage in ('lead', 'contacted', 'proposal', 'won', 'lost')),
  estimated_value_cents bigint,
  notes text,
  created_at timestamptz not null default now()
);

create table onboarding_checklist_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  step_key text not null check (
    step_key in ('agreement_sent', 'agreement_signed', 'kickoff_scheduled', 'folders_created', 'first_invoice_configured')
  ),
  completed_at timestamptz,
  unique (org_id, step_key)
);

-- ============================================================
-- New-user trigger: mirror auth.users into profiles, backfill
-- any org_membership invited by email before signup.
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  update org_memberships
  set user_id = new.id, accepted_at = now()
  where invited_email = new.email and user_id is null;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- RLS helper functions
-- ============================================================

create or replace function is_axel_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and platform_role = 'axel_admin'
  );
$$;

create or replace function my_org_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select org_id from org_memberships
  where user_id = auth.uid() and accepted_at is not null;
$$;

create or replace function my_org_role(target_org uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from org_memberships
  where user_id = auth.uid() and org_id = target_org and accepted_at is not null
  limit 1;
$$;

create or replace function project_org_id(target_project uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select org_id from projects where id = target_project;
$$;

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table profiles enable row level security;
create policy "users see own profile" on profiles for select using (id = auth.uid());
create policy "axel sees all profiles" on profiles for select using (is_axel_admin());
create policy "users update own profile" on profiles for update using (id = auth.uid());

alter table organizations enable row level security;
create policy "axel sees all orgs" on organizations for select using (is_axel_admin());
create policy "members see own org" on organizations for select using (id in (select my_org_ids()));
create policy "axel writes orgs" on organizations for insert with check (is_axel_admin());
create policy "axel updates orgs" on organizations for update using (is_axel_admin());

alter table org_memberships enable row level security;
create policy "axel sees all memberships" on org_memberships for select using (is_axel_admin());
create policy "members see own org memberships" on org_memberships for select using (org_id in (select my_org_ids()));
create policy "axel writes memberships" on org_memberships for insert with check (is_axel_admin());
create policy "owners invite within their org" on org_memberships for insert with check (my_org_role(org_id) = 'owner');
create policy "axel updates memberships" on org_memberships for update using (is_axel_admin());

alter table projects enable row level security;
create policy "axel sees all projects" on projects for select using (is_axel_admin());
create policy "members see own org projects" on projects for select using (org_id in (select my_org_ids()));
create policy "axel writes projects" on projects for insert with check (is_axel_admin());
create policy "axel updates projects" on projects for update using (is_axel_admin());

-- Reusable shape for every project_id-scoped table: axel sees/writes all,
-- org members see rows whose project belongs to their org.

alter table board_columns enable row level security;
create policy "axel sees all board_columns" on board_columns for select using (is_axel_admin());
create policy "members see own project board_columns" on board_columns for select using (project_org_id(project_id) in (select my_org_ids()));
create policy "axel writes board_columns" on board_columns for insert with check (is_axel_admin());
create policy "axel updates board_columns" on board_columns for update using (is_axel_admin());

alter table board_cards enable row level security;
create policy "axel sees all board_cards" on board_cards for select using (is_axel_admin());
create policy "members see own project board_cards" on board_cards for select using (project_org_id(project_id) in (select my_org_ids()));
create policy "axel writes board_cards" on board_cards for insert with check (is_axel_admin());
create policy "axel updates board_cards" on board_cards for update using (is_axel_admin());
create policy "axel deletes board_cards" on board_cards for delete using (is_axel_admin());

alter table board_card_files enable row level security;
create policy "axel sees all board_card_files" on board_card_files for select using (is_axel_admin());
create policy "members see own project board_card_files" on board_card_files for select using (
  exists (select 1 from board_cards c where c.id = card_id and project_org_id(c.project_id) in (select my_org_ids()))
);
create policy "axel writes board_card_files" on board_card_files for insert with check (is_axel_admin());

alter table folders enable row level security;
create policy "axel sees all folders" on folders for select using (is_axel_admin());
create policy "members see own project folders" on folders for select using (project_org_id(project_id) in (select my_org_ids()));
create policy "axel writes folders" on folders for insert with check (is_axel_admin());
create policy "axel updates folders" on folders for update using (is_axel_admin());
create policy "axel deletes folders" on folders for delete using (is_axel_admin());

alter table files enable row level security;
create policy "axel sees all files" on files for select using (is_axel_admin());
create policy "members see own project files" on files for select using (project_org_id(project_id) in (select my_org_ids()));
create policy "axel writes files" on files for insert with check (is_axel_admin());
create policy "members upload files into own project" on files for insert with check (project_org_id(project_id) in (select my_org_ids()));

alter table decisions enable row level security;
create policy "axel sees all decisions" on decisions for select using (is_axel_admin());
create policy "members see own project decisions" on decisions for select using (project_org_id(project_id) in (select my_org_ids()));
create policy "axel writes decisions" on decisions for insert with check (is_axel_admin());

alter table decision_participants enable row level security;
create policy "axel sees all decision_participants" on decision_participants for select using (is_axel_admin());
create policy "members see own project decision_participants" on decision_participants for select using (
  exists (select 1 from decisions d where d.id = decision_id and project_org_id(d.project_id) in (select my_org_ids()))
);
create policy "axel writes decision_participants" on decision_participants for insert with check (is_axel_admin());

alter table meetings enable row level security;
create policy "axel sees all meetings" on meetings for select using (is_axel_admin());
create policy "members see own project meetings" on meetings for select using (project_org_id(project_id) in (select my_org_ids()));
create policy "axel writes meetings" on meetings for insert with check (is_axel_admin());
create policy "axel updates meetings" on meetings for update using (is_axel_admin());

alter table feedback_threads enable row level security;
create policy "axel sees all feedback_threads" on feedback_threads for select using (is_axel_admin());
create policy "members see own project feedback_threads" on feedback_threads for select using (project_org_id(project_id) in (select my_org_ids()));
create policy "axel writes feedback_threads" on feedback_threads for insert with check (is_axel_admin());
create policy "members open feedback_threads on own project" on feedback_threads for insert with check (project_org_id(project_id) in (select my_org_ids()));
create policy "axel updates feedback_threads" on feedback_threads for update using (is_axel_admin());

alter table feedback_messages enable row level security;
create policy "axel sees all feedback_messages" on feedback_messages for select using (is_axel_admin());
create policy "members see own project feedback_messages" on feedback_messages for select using (
  exists (select 1 from feedback_threads t where t.id = thread_id and project_org_id(t.project_id) in (select my_org_ids()))
);
create policy "axel writes feedback_messages" on feedback_messages for insert with check (is_axel_admin());
create policy "members post feedback_messages on own project" on feedback_messages for insert with check (
  exists (select 1 from feedback_threads t where t.id = thread_id and project_org_id(t.project_id) in (select my_org_ids()))
);

-- Invoices/contracts: stricter — Owner role only, not just any org member.

alter table invoices enable row level security;
create policy "axel sees all invoices" on invoices for select using (is_axel_admin());
create policy "owners see own org invoices" on invoices for select using (org_id in (select my_org_ids()) and my_org_role(org_id) = 'owner');
create policy "axel writes invoices" on invoices for insert with check (is_axel_admin());
create policy "axel updates invoices" on invoices for update using (is_axel_admin());

alter table contracts enable row level security;
create policy "axel sees all contracts" on contracts for select using (is_axel_admin());
create policy "owners see own org contracts" on contracts for select using (org_id in (select my_org_ids()) and my_org_role(org_id) = 'owner');
create policy "axel writes contracts" on contracts for insert with check (is_axel_admin());
create policy "axel updates contracts" on contracts for update using (is_axel_admin());

alter table risks enable row level security;
create policy "axel sees all risks" on risks for select using (is_axel_admin());
create policy "members see own project risks" on risks for select using (project_org_id(project_id) in (select my_org_ids()));
create policy "axel writes risks" on risks for insert with check (is_axel_admin());
create policy "axel updates risks" on risks for update using (is_axel_admin());

alter table weekly_updates enable row level security;
create policy "axel sees all weekly_updates" on weekly_updates for select using (is_axel_admin());
create policy "members see own project weekly_updates" on weekly_updates for select using (project_org_id(project_id) in (select my_org_ids()));
create policy "axel writes weekly_updates" on weekly_updates for insert with check (is_axel_admin());

alter table hours_entries enable row level security;
create policy "axel sees all hours_entries" on hours_entries for select using (is_axel_admin());
create policy "members see own project hours_entries" on hours_entries for select using (project_org_id(project_id) in (select my_org_ids()));
create policy "axel writes hours_entries" on hours_entries for insert with check (is_axel_admin());

alter table prospects enable row level security;
create policy "axel only prospects" on prospects for select using (is_axel_admin());
create policy "axel writes prospects" on prospects for insert with check (is_axel_admin());
create policy "axel updates prospects" on prospects for update using (is_axel_admin());

alter table onboarding_checklist_items enable row level security;
create policy "axel sees all onboarding_checklist_items" on onboarding_checklist_items for select using (is_axel_admin());
create policy "members see own org onboarding_checklist_items" on onboarding_checklist_items for select using (org_id in (select my_org_ids()));
create policy "axel writes onboarding_checklist_items" on onboarding_checklist_items for insert with check (is_axel_admin());
create policy "axel updates onboarding_checklist_items" on onboarding_checklist_items for update using (is_axel_admin());
