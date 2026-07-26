-- Kanban board upgrade: multiple assignees per card, long-form descriptions,
-- comments, external links, and letting clients attach project files to
-- cards (previously axel-only). Brings Board up to Trello-parity.

-- ============================================================
-- Multiple assignees (replaces the single board_cards.assignee_id column)
-- ============================================================

create table board_card_assignees (
  card_id uuid not null references board_cards (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  primary key (card_id, profile_id)
);
create index board_card_assignees_card_idx on board_card_assignees (card_id);

insert into board_card_assignees (card_id, profile_id)
select id, assignee_id from board_cards where assignee_id is not null;

alter table board_cards drop column assignee_id;

-- ============================================================
-- Card description (long-form detail, shown in the card modal)
-- ============================================================

alter table board_cards add column description text;

-- ============================================================
-- Comments
-- ============================================================

create table board_card_comments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references board_cards (id) on delete cascade,
  author_id uuid references profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);
create index board_card_comments_card_idx on board_card_comments (card_id);

-- ============================================================
-- External links ("attach a link" — Trello-style, for things that aren't a
-- project file: a shared doc, a spec URL, an external reference)
-- ============================================================

create table board_card_links (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references board_cards (id) on delete cascade,
  url text not null,
  label text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index board_card_links_card_idx on board_card_links (card_id);

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table board_card_assignees enable row level security;
create policy "axel sees all board_card_assignees" on board_card_assignees for select using (is_axel_admin());
create policy "members see own project board_card_assignees" on board_card_assignees for select using (
  exists (select 1 from board_cards c where c.id = card_id and project_org_id(c.project_id) in (select my_org_ids()))
);
create policy "axel writes board_card_assignees" on board_card_assignees for insert with check (is_axel_admin());
create policy "members write board_card_assignees on own project" on board_card_assignees for insert with check (
  exists (select 1 from board_cards c where c.id = card_id and project_org_id(c.project_id) in (select my_org_ids()))
);
create policy "axel deletes board_card_assignees" on board_card_assignees for delete using (is_axel_admin());
create policy "members delete board_card_assignees on own project" on board_card_assignees for delete using (
  exists (select 1 from board_cards c where c.id = card_id and project_org_id(c.project_id) in (select my_org_ids()))
);

alter table board_card_comments enable row level security;
create policy "axel sees all board_card_comments" on board_card_comments for select using (is_axel_admin());
create policy "members see own project board_card_comments" on board_card_comments for select using (
  exists (select 1 from board_cards c where c.id = card_id and project_org_id(c.project_id) in (select my_org_ids()))
);
create policy "axel writes board_card_comments" on board_card_comments for insert with check (is_axel_admin());
create policy "members write board_card_comments on own project" on board_card_comments for insert with check (
  exists (select 1 from board_cards c where c.id = card_id and project_org_id(c.project_id) in (select my_org_ids()))
);
create policy "axel deletes board_card_comments" on board_card_comments for delete using (is_axel_admin());
create policy "authors delete own board_card_comments" on board_card_comments for delete using (author_id = auth.uid());

alter table board_card_links enable row level security;
create policy "axel sees all board_card_links" on board_card_links for select using (is_axel_admin());
create policy "members see own project board_card_links" on board_card_links for select using (
  exists (select 1 from board_cards c where c.id = card_id and project_org_id(c.project_id) in (select my_org_ids()))
);
create policy "axel writes board_card_links" on board_card_links for insert with check (is_axel_admin());
create policy "members write board_card_links on own project" on board_card_links for insert with check (
  exists (select 1 from board_cards c where c.id = card_id and project_org_id(c.project_id) in (select my_org_ids()))
);
create policy "axel deletes board_card_links" on board_card_links for delete using (is_axel_admin());
create policy "members delete board_card_links on own project" on board_card_links for delete using (
  exists (select 1 from board_cards c where c.id = card_id and project_org_id(c.project_id) in (select my_org_ids()))
);

-- Clients could previously only see files attached to their cards, not
-- attach/detach their own — let any accepted member manage attachments on
-- their own project's cards, matching the board_cards write policy above.
create policy "members write board_card_files on own project" on board_card_files for insert with check (
  exists (select 1 from board_cards c where c.id = card_id and project_org_id(c.project_id) in (select my_org_ids()))
);
create policy "members delete board_card_files on own project" on board_card_files for delete using (
  exists (select 1 from board_cards c where c.id = card_id and project_org_id(c.project_id) in (select my_org_ids()))
);
