# Alchemica

Marketing site, client portal (`/portal`) and admin (`/admin`) for Alchemica — Next.js 16 + Supabase.

## Local development

### Requirements

- Node.js 22.18+.
- Docker Desktop, running. On Windows it needs WSL 2 (`wsl --install` from an admin terminal, then reboot).

### First run

```bash
npm install
npm run db:start   # starts Supabase in Docker, applies supabase/migrations and supabase/seed.sql
npm run db:env     # writes the local Supabase URL and keys into .env.local
npm run dev
```

Open http://localhost:3000.

### Test logins

Sign-in is by magic link. Request it at http://localhost:3000/login, then open the email in the local inbox at http://127.0.0.1:54324.

| Email | Role |
| --- | --- |
| `admin@alchemica.test` | Platform admin (`/admin`) |
| `owner@cliente.test` | Client owner (`/portal`, sees invoices and contracts) |
| `colab@cliente.test` | Client collaborator (`/portal`) |

### Database commands

| Command | What it does |
| --- | --- |
| `npm run db:start` | Start local Supabase |
| `npm run db:stop` | Stop it (data is kept) |
| `npm run db:reset` | Wipe and recreate from migrations + seed |
| `npm run db:env` | Refresh `.env.local` with the local keys |

Supabase Studio (table editor, SQL) runs at http://127.0.0.1:54323.

### Optional services

The contact form, invite emails and contract signing need `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `DOCUMENSO_API_KEY` and `DOCUMENSO_WEBHOOK_SECRET` in `.env.local` (see `.env.example`). Without them those features show a fallback message; everything else works.
