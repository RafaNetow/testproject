"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { recordActivity } from "@/lib/activity";
import { inviteRecordedMessage, sendInviteEmail, type InviteResult } from "@/lib/invite-email";

/**
 * Lets a client's "owner" add a collaborator to their own workspace from the
 * portal Team page. Works like the admin's inviteMember — it records a
 * pending org_memberships row by email and the handle_new_user trigger links
 * it on first sign-in — but an owner can only ever invite collaborators, and
 * can't change an existing member's role. The "owners invite within their
 * org" RLS policy enforces both at the database level too.
 */
export async function inviteCollaborator(orgId: string, formData: FormData): Promise<InviteResult> {
  await requireOwnerRole(orgId);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, emailSent: false, message: "Enter a valid email address." };
  }

  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();
  if (!org) {
    return { success: false, emailSent: false, message: "Workspace not found." };
  }

  const { data: existing } = await supabase
    .from("org_memberships")
    .select("id")
    .eq("org_id", orgId)
    .eq("invited_email", email)
    .maybeSingle();
  if (existing) {
    return { success: false, emailSent: false, message: "That email is already on the team." };
  }

  const { error } = await supabase
    .from("org_memberships")
    .insert({ org_id: orgId, invited_email: email, role: "collaborator" });
  if (error) {
    return { success: false, emailSent: false, message: `Couldn't add them: ${error.message}` };
  }

  await recordActivity({ kind: "team", orgId, message: `invited ${email} to the workspace as a collaborator` });
  revalidatePath("/portal/team");
  revalidatePath(`/admin/clients/${orgId}`);

  const { emailSent, message } = await sendInviteEmail(org.name, email);
  return { success: true, emailSent, message: inviteRecordedMessage(emailSent, message) };
}
