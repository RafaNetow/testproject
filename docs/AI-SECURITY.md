# Alchemica Assistant — how client data is protected

The assistant has two parts:

- **Ask Alchemica (clients):** answers questions about the client's own project. It lives as a tab in the top-bar chat panel, and only for clients the admin has switched on.
- **Suggest reply (admin):** drafts a reply to the client's latest message. Axel edits it and sends it himself; nothing is ever sent automatically.

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

2. **Each client sees only their own data.**
   - The project context is built in `src/lib/ai/context.ts` with the signed-in user's own Supabase session, under the same Row-Level Security as the rest of the portal.
   - Asking about another company's project returns nothing, because the database refuses it.
   - The service-role key is never used on the AI path.

3. **The model receives as little as possible.**
   - It gets the current project only: stage names, % and dates, stage descriptions, decisions, deliverable and data-request titles and statuses, what's waiting, and the last 15 messages, using names but not email addresses.
   - It never gets invoices, hours or rates, file contents, other projects or other clients.
   - See `formatContext` in `src/lib/ai/format.ts`; its tests check that no email address appears.

4. **Each client opts in.**
   - AI is off for every organisation (`organizations.ai_enabled = false`) until the admin switches it on in the client's settings, ideally after the client has agreed under the DPA.
   - Only the admin can change that flag; RLS lets only the admin update organisations.

5. **A human checks the risky part.**
   - Axel's drafts only fill the text box.
   - Client answers are labelled **AI**, show the sources they used as links, carry a note that decisions and technical advice come from Axel, and offer **Ask Axel instead**.

6. **Prompt-injection resistance.**
   - The assistant is read-only: no tools, no actions, no external links.
   - Project text is wrapped in a `PROJECT DATA … END OF PROJECT DATA` block, and the prompt tells the model to treat it as data and ignore any instructions inside it.
   - Answers are rendered as plain text, never HTML.

7. **Audit and limits.**
   - Every question, answer, cited sources and model name is stored in `ai_interactions`. The admin can read every row; each user reads only their own.
   - A user can ask at most 30 questions per rolling hour (`ai_rate_ok()`).

8. **Where the data is processed.**
   - DeepSeek's official API processes requests in China, so **use it with demo or test data only**.
   - For real client data, point `AI_BASE_URL` at an EU-hosted deployment of the DeepSeek model under a data-processing agreement. It is the same API, so no code changes.
   - The admin switch shows this warning.

## Turning it on (local)

1. Copy the `AI_*` block from `.env.example` into `.env.local`; the empty lines are already there.
2. Paste the key after `AI_API_KEY=`, set `AI_ENABLED=true`, and restart `npm run dev`.
3. As admin, open a client page, then the gear icon, and switch on **AI assistant for this client**.
4. The client now sees **Ask Alchemica** in the chat panel. The admin sees **Suggest reply** in every thread.

On Vercel, add the same variables in the project's Environment Variables, never in the code.

## Follow-ups

- Purge `ai_interactions` rows older than 90 days, for example in the weekly cron.
- Before using real client data, move `AI_BASE_URL` to an EU-hosted endpoint and add the provider to the DPA.
