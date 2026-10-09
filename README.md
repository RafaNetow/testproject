# Alchemica

Marketing site, client portal (`/portal`) and admin (`/admin`) for Alchemica — Next.js 16 + Supabase.

## Local development

### Requirements

- Node.js 22.18+.
- Docker Desktop, running. On Windows it needs WSL 2 (`wsl --install` from an admin terminal, then reboot).

### First run

```bash
npm install
npm run db:start   # starts Supabase in Docker, applies migrations and the demo data, uploads demo files
npm run db:env     # writes the local Supabase URL and keys into .env.local
npm run dev
```

Open http://localhost:3000. Look for the green **Local DB** badge in the corner: if it isn't there (or it's red), you are not on the local database.

### Test logins

Sign-in is by magic link. Request it at http://localhost:3000/login, then open the email in the local inbox at http://127.0.0.1:54324 (the login screen links to it).

| Email | Role | Use it to |
| --- | --- | --- |
| `owner@cliente.test` | Client owner | **The demo user that has everything.** Two projects, three deliverables awaiting review, board, files, decisions, meetings, updates, hours, invoices, contracts and notifications. Can approve deliverables. |
| `colab@cliente.test` | Client collaborator | See what a non-owner can and can't do (no invoices, contracts or deliverable approval). |
| `admin@alchemica.test` | Platform admin (`/admin`) | Manage clients, projects and deliverables. |

To make your own email an admin in the local database, sign in with it once, then run `npm run db:admin -- you@example.com`.

### What the demo data contains

`supabase/seed.sql` holds the core data (organization, users, one project). `supabase/seed-demo.sql` adds the rest of the demo workspace: a second project, deliverables in every status, extra board cards, comments, decisions, meetings, updates, hours, invoices, contracts and notifications. Real files can't be created from SQL, so `scripts/seed-files.mjs` uploads sample CSV/PDF/text files to local Storage and attaches them to deliverables; it runs automatically after `db:start` and `db:reset`, and is safe to run again.

Some rows deliberately reproduce known issues from the audit (a draft invoice that shows as overdue, an invoice due today).

### Database commands

| Command | What it does |
| --- | --- |
| `npm run db:start` | Start local Supabase (then uploads demo files) |
| `npm run db:stop` | Stop it (data is kept) |
| `npm run db:reset` | Wipe and recreate from migrations + seed + demo files |
| `npm run db:files` | Re-run only the demo file upload |
| `npm run db:env` | Refresh `.env.local` with the local keys |
| `npm run db:admin -- <email>` | Make an existing local user an admin |

Supabase Studio (table editor, SQL) runs at http://127.0.0.1:54323.

### Optional services

The contact form, invite emails and contract signing need `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `DOCUMENSO_API_KEY` and `DOCUMENSO_WEBHOOK_SECRET` in `.env.local` (see `.env.example`). Without them those features show a fallback message; everything else works.

## Deliverables

A deliverable is a formal output of an engagement (a report, a recommendation) that the client signs off.

- **Statuses:** `draft` (admin only) → `in_progress` → `in_review` (visible to the client, who is notified) → `approved` or `changes_requested` → back to `in_review`.
- **Admin:** manages them under each project's *Deliverables* tab, attaching files from the project's Files.
- **Client owner:** approves or requests changes (a note is required) from *Deliverables* in the portal. The sidebar counter shows how many are waiting on them. Collaborators can read but not respond.
- **Security:** clients never write to the `deliverables` table. Their only write is the `review_deliverable()` database function, which checks the caller is the workspace owner and that the deliverable is actually awaiting review.
