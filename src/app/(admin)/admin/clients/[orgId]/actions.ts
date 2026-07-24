"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type InviteResult = {
  success: boolean;
  emailSent: boolean;
  message?: string;
};

/**
 * Invites someone into an org by email. Doesn't create an auth account —
 * it just records the invite (org_memberships.invited_email), and the
 * existing `handle_new_user` trigger auto-links it (sets user_id +
 * accepted_at) the moment that email signs in via the normal shared
 * magic-link flow. If the email is already invited to this org, updates
 * the role instead of creating a duplicate row.
 *
 * The invite record is created regardless of whether the notification
 * email actually sends — Resend's sandbox sender can only deliver to the
 * Resend account's own address until a domain is verified, so this is
 * expected to fail to send for real client addresses right now. The
 * result is surfaced to the admin instead of failing silently.
 */
export async function inviteMember(orgId: string, formData: FormData): Promise<InviteResult> {
  await requireAxelAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "owner");
  if (!email || (role !== "owner" && role !== "collaborator")) {
    return { success: false, emailSent: false, message: "Enter a valid email and role." };
  }

  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();
  if (!org) {
    return { success: false, emailSent: false, message: "Client not found." };
  }

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

  revalidatePath(`/admin/clients/${orgId}`);

  if (!resend) {
    return {
      success: true,
      emailSent: false,
      message: "Invite recorded, but email isn't configured yet — let them know directly to sign in at /login.",
    };
  }

  const { error } = await resend.emails.send({
    from: "Alchemica <onboarding@resend.dev>",
    to: email,
    subject: "You've been invited to the Alchemica client portal",
    text: `You've been added to ${org.name}'s workspace on Alchemica.\n\nSign in at https://alchemica.vercel.app/login using this email address (${email}) — no password needed, just a one-time link sent to your inbox.`,
  });

  if (error) {
    return {
      success: true,
      emailSent: false,
      message:
        "Invite recorded, but the email couldn't be sent (the Resend sending domain isn't verified yet, so it can only email your own inbox) — let them know directly to sign in at /login with this address.",
    };
  }

  return { success: true, emailSent: true, message: "Invite sent." };
}

export async function removeMember(orgId: string, membershipId: string) {
  await requireAxelAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("org_memberships").delete().eq("id", membershipId);
  if (error) {
    throw new Error(`Couldn't remove member: ${error.message}`);
  }
  revalidatePath(`/admin/clients/${orgId}`);
}

export async function updateOrganization(orgId: string, formData: FormData) {
  await requireAxelAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const status = String(formData.get("status") ?? "onboarding");
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update({ name, status }).eq("id", orgId);
  if (error) {
    throw new Error(`Couldn't save changes: ${error.message}`);
  }
  revalidatePath(`/admin/clients/${orgId}`);
  revalidatePath("/admin/clients");
}

/** Cascades to delete every project, board, file, decision, etc. under this org. */
export async function deleteOrganization(orgId: string) {
  await requireAxelAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").delete().eq("id", orgId);
  if (error) {
    throw new Error(`Couldn't delete client: ${error.message}`);
  }
  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}
