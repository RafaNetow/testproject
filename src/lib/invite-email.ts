import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Where invite emails send people to sign in. Local dev sets this to
// localhost so an invite never points a tester at the production site.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.alchemica.dk";

export type InviteResult = {
  success: boolean;
  emailSent: boolean;
  message?: string;
};

/**
 * The invite email, shared by every way someone gets added to a workspace
 * (admin invite, resend, an owner inviting a collaborator) — same email,
 * same failure messaging.
 */
export async function sendInviteEmail(
  orgName: string,
  email: string
): Promise<{ emailSent: boolean; message: string }> {
  if (!resend) {
    return {
      emailSent: false,
      message: "Email isn't configured yet — let them know directly to sign in at /login.",
    };
  }

  const { error } = await resend.emails.send({
    from: "Alchemica <hello@alchemica.dk>",
    to: email,
    replyTo: "hello@alchemica.dk",
    subject: "You've been invited to the Alchemica client portal",
    text: `You've been added to ${orgName}'s workspace on Alchemica.\n\nSign in at ${SITE_URL}/login using this email address (${email}) — no password needed, just a one-time link sent to your inbox.`,
  });

  if (error) {
    return {
      emailSent: false,
      message: "The email couldn't be sent — let them know directly to sign in at /login with this address.",
    };
  }

  return { emailSent: true, message: "Invite sent." };
}

/** "Invite recorded, but …" when the record saved and the email didn't go out. */
export function inviteRecordedMessage(emailSent: boolean, message: string) {
  return emailSent ? message : `Invite recorded, but ${message.charAt(0).toLowerCase()}${message.slice(1)}`;
}
