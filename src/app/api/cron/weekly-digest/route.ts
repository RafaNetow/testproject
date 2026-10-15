import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDigest, digestIsWorthSending, digestRecipients, renderDigest } from "@/lib/digest";

/**
 * Monday digest for every client member who hasn't opted out. Triggered by
 * Vercel Cron (vercel.json), which sends `Authorization: Bearer $CRON_SECRET`.
 * Without RESEND_API_KEY (local development) it reports who would receive an
 * email instead of sending.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const recipients = await digestRecipients(admin);
  const results: { email: string; status: "sent" | "skipped-empty" | "would-send" | "failed" }[] = [];

  for (const r of recipients) {
    const data = await buildDigest(admin, r.profileId);
    if (!data || !digestIsWorthSending(data)) {
      results.push({ email: r.email, status: "skipped-empty" });
      continue;
    }
    const { subject, html, text } = renderDigest(data);
    if (!resend) {
      console.info(`weekly-digest: would send "${subject}" to ${r.email}`);
      results.push({ email: r.email, status: "would-send" });
      continue;
    }
    try {
      await resend.emails.send({ from: "Alchemica <hello@alchemica.dk>", to: r.email, replyTo: "hello@alchemica.dk", subject, html, text });
      results.push({ email: r.email, status: "sent" });
    } catch (err) {
      console.error(`weekly-digest: send to ${r.email} failed`, err);
      results.push({ email: r.email, status: "failed" });
    }
  }

  return Response.json({ recipients: results.length, results });
}
