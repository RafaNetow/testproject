-- ============================================================
-- Admin's own calendar events (Minimal-style calendar)
-- ============================================================
--
-- Blocks, reminders and personal appointments Axel puts on his calendar.
-- Client meetings stay in `meetings` (clients see those); these are private:
-- only the admin who owns a row can read or change it.

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 200),
  description text check (description is null or length(description) <= 2000),
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  color text not null default 'primary'
    check (color in ('primary', 'info', 'success', 'warning', 'error', 'secondary')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_ordered check (end_at >= start_at)
);

create index calendar_events_owner_start_idx on calendar_events (owner_id, start_at);

alter table calendar_events enable row level security;

create policy "admin manages own calendar events" on calendar_events
  for all
  using (is_axel_admin() and owner_id = auth.uid())
  with check (is_axel_admin() and owner_id = auth.uid());
