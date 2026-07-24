"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Invites someone into an org by email. Doesn't create an auth account —
 * it just records the invite (org_memberships.invited_email), and the
 * `handle_new_user` trigger auto-links it (sets user_id + accepted_at) the
 * moment that email signs in via the normal shared magic-link flow. If the
 * email is already invited to this org, updates the role instead of
 * creating a duplicate row.
 */
export async function inviteMember(orgId: string, formData: FormData) {
  await requireAxelAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "owner");
  if (!email || (role !== "owner" && role !== "collaborator")) return;

  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();
  if (!org) return;

  const { data: existing } = await supabase
    .from("org_memberships")
    .select("id")
    .eq("org_id", orgId)
    .eq("invited_email", email)
    .maybeSingle();

  if (existing) {
    await supabase.from("org_memberships").update({ role }).eq("id", existing.id);
  } else {
    await supabase.from("org_memberships").insert({ org_id: orgId, invited_email: email, role });
  }

  if (resend) {
    await resend.emails.send({
      from: "Alchemica <onboarding@resend.dev>",
      to: email,
      subject: "You've been invited to the Alchemica client portal",
      text: `You've been added to ${org.name}'s workspace on Alchemica.\n\nSign in at https://alchemica.vercel.app/login using this email address (${email}) — no password needed, just a one-time link sent to your inbox.`,
    });
  }

  revalidatePath(`/admin/clients/${orgId}`);
}
