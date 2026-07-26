import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Fires an email to Axel's own inbox for events he'd otherwise have to
 * notice by checking back manually (a client uploaded a file, logged a
 * decision, signed a contract). Uses the same shared Resend sandbox sender
 * as the contact form and invite emails — that sender can only deliver to
 * the Resend account's own address until a domain is verified, which is
 * exactly Axel's inbox, so this works today with no extra setup.
 *
 * Deliberately swallows every failure: a notification email is a courtesy,
 * never a reason to fail the action that triggered it.
 */
export async function notifyAxel(subject: string, lines: string[]) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: "Alchemica <onboarding@resend.dev>",
      to: process.env.CONTACT_TO_EMAIL || "hello@alchemica.com",
      subject,
      text: lines.join("\n"),
    });
  } catch (err) {
    console.error("notifyAxel: send failed", err);
  }
}
