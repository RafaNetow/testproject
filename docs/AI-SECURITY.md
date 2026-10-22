# Alchemica Assistant — how client data is protected

The assistant is **for the admin only**. Clients never talk to an AI.

- **Suggest reply:** drafts a reply to the client's latest message. Axel edits it and sends it himself; nothing is ever sent automatically.
- **Assistant page:** Axel's rules, his corrections and the anonymised case book (below).

A client-facing "Ask Alchemica" tab existed earlier and was removed in October 2026. The `organizations.ai_enabled` column and its guard trigger (migration 0025) remain in the database but nothing reads them any more.

It talks to any OpenAI-compatible model endpoint, configured in `.env.local`:

| Variable | Purpose |
|---|---|
| `AI_ENABLED` | `true` turns the assistant on; anything else turns it off everywhere (kill switch) |
| `AI_BASE_URL` | Model endpoint, e.g. `https://api.deepseek.com` or an EU-hosted deployment |
| `AI_API_KEY` | The provider key. Server-only: never prefix with `NEXT_PUBLIC_` |
| `AI_MODEL` | Model name, e.g. `deepseek-chat` |

## Safeguards

1. **The key never reaches the browser.**
   - It is read only in `src/lib/ai/provider.ts`, which imports `server-only`; a client-side import fails the build.
   - Errors returned by the provider are logged on the server and never shown to users.

2. **Only the admin can use it.**
   - Every AI action calls `requireAxelAdmin()` first.
   - The project context is built in `src/lib/ai/context.ts` with the signed-in admin's own Supabase session, under Row-Level Security. The service-role key is never used on the AI path.

3. **The model receives as little as possible.**
   - It gets the current project only: stage names, % and dates, stage descriptions, decisions, deliverable and data-request titles and statuses, what's waiting, and the last 15 messages, using names but not email addresses.
   - It never gets invoices, hours or rates, file contents, other projects or other clients.
   - See `formatContext` in `src/lib/ai/format.ts`; its tests check that no email address appears.

4. **A human checks everything.**
   - Drafts only fill the text box; Axel reads, edits and sends.
   - Clients never see AI output directly.

5. **Prompt-injection resistance.**
   - The assistant is read-only: no tools, no actions, no external links.
   - Project text is wrapped in a `PROJECT DATA … END OF PROJECT DATA` block, and the prompt tells the model to treat it as data and ignore any instructions inside it.
   - Answers are rendered as plain text, never HTML.

6. **Audit.**
   - Every draft, the message it answered, the text Axel finally sent and the model name are stored in `ai_interactions`, readable only by the admin.

7. **Where the data is processed.**
   - DeepSeek's official API processes requests in China, so **use it with demo or test data only**.
   - For real client data, point `AI_BASE_URL` at an EU-hosted deployment of the DeepSeek model under a data-processing agreement. It is the same API, so no code changes.

## Turning it on (local)

1. Copy the `AI_*` block from `.env.example` into `.env.local`; the empty lines are already there.
2. Paste the key after `AI_API_KEY=`, set `AI_ENABLED=true`, and restart `npm run dev`.
3. As admin, open any conversation in the chat bubble: **Suggest reply** appears above the message box.

On Vercel, add the same variables in the project's Environment Variables, never in the code.

## Follow-ups

- Purge `ai_interactions` rows older than 90 days, for example in the weekly cron.
- Before using real client data, move `AI_BASE_URL` to an EU-hosted endpoint and add the provider to the DPA.

## What the admin copilot learns from Axel (admin only)

The **Assistant** page in the admin shows and edits everything the copilot has learned. None of it is visible to clients. Clients and collaborators have no read or write access to these tables.

| What | How it is stored | How it is used |
|---|---|---|
| **Corrections** | For each AI draft, `ai_interactions.final_text` keeps the message Axel actually sent (`record_draft_final()`, admin only) | The latest four edited pairs go into the next draft as tone examples |
| **Rules** | One editable text in `ai_rules` | Added to every draft's instructions |
| **Case book** | Anonymised write-ups in `case_studies`, drafted by the assistant from a project and edited by Axel before saving | The two most similar cases are shown to the copilot when drafting |

Confidentiality between clients:

- **Case book:** company and person names are removed from the project data before the model sees it, and again from its answer. A project title is removed as a whole phrase. Axel reads and edits every entry before it is saved, and the page reminds him to check that nothing identifies the client.
- **Correction examples** come from other conversations, so names are scrubbed and the prompt tells the model to learn tone only and never reuse their facts. **Residual risk:** a model can still echo a detail, which is why a draft is only text in a box and Axel reads it before sending. Do not use drafts without reading them.
- Nothing learned is shared with clients, and nothing is learned automatically from client conversations: only from what Axel edits and saves.

## Signing contracts in the portal

Contracts can be signed in the portal (`signing_method = 'portal'`) or by email through Documenso.

- The workspace **owner** reviews the PDF and signs by typing their full name and confirming. Collaborators cannot see contracts, and only the owner of that organisation can complete a signature (`complete_portal_signature()` checks it; the contracts table has no update policy for clients).
- The server appends a **certificate page** to the PDF (name, account, time in UTC, IP address, browser and the SHA-256 fingerprint of the original) and files it as the signed copy. The service-role client is used only to store that file, at a path built from the contract's own organisation id.
- This is a **simple electronic signature**: valid evidence for most commercial agreements in the EU and Denmark, but weaker than an advanced or qualified signature (for example MitID or Documenso's advanced signing). Use those where a contract or the law requires a higher level.
