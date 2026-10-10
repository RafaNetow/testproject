"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { recordActivity, entityInfo, quoted } from "@/lib/activity";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Where invite emails send people to sign in. Local dev sets this to
// localhost so an invite never points a tester at the production site.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.alchemica.dk";

export type InviteResult = {
  success: boolean;
  emailSent: boolean;
  message?: string;
};

/** Shared by inviteMember and resendInvite — same email, same failure messaging. */
async function sendInviteEmail(
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

  await recordActivity({
    kind: "team",
    orgId,
    message: existing
      ? `made ${email} ${role === "owner" ? "an owner" : "a collaborator"}`
      : `invited ${email} to the workspace as ${role === "owner" ? "an owner" : "a collaborator"}`,
  });
  revalidatePath(`/admin/clients/${orgId}`);

  const { emailSent, message } = await sendInviteEmail(org.name, email);
  return { success: true, emailSent, message: emailSent ? message : `Invite recorded, but ${message.charAt(0).toLowerCase()}${message.slice(1)}` };
}

/** Re-sends the invite email for an already-invited (but not yet accepted) member. */
export async function resendInvite(orgId: string, email: string): Promise<InviteResult> {
  await requireAxelAdmin();
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();
  if (!org) {
    return { success: false, emailSent: false, message: "Client not found." };
  }

  const { emailSent, message } = await sendInviteEmail(org.name, email);
  return { success: true, emailSent, message };
}

export async function removeMember(orgId: string, membershipId: string) {
  await requireAxelAdmin();
  const leaving = await entityInfo("org_memberships", membershipId, "invited_email", false);
  const supabase = await createClient();
  const { error } = await supabase.from("org_memberships").delete().eq("id", membershipId);
  if (error) {
    throw new Error(`Couldn't remove member: ${error.message}`);
  }
  await recordActivity({ kind: "team", orgId, message: `removed ${leaving.name ?? "a member"} from the workspace` });
  revalidatePath(`/admin/clients/${orgId}`);
}

export async function updateOrganization(orgId: string, formData: FormData) {
  await requireAxelAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const status = String(formData.get("status") ?? "onboarding");
  const cvrNumber = String(formData.get("cvr_number") ?? "").trim();
  const billingAddress = String(formData.get("billing_address") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      status,
      cvr_number: cvrNumber || null,
      billing_address: billingAddress || null,
    })
    .eq("id", orgId);
  if (error) {
    throw new Error(`Couldn't save changes: ${error.message}`);
  }
  // Client status (e.g. "at risk") is internal — only the team hears about it.
  await recordActivity({
    kind: "client",
    orgId,
    message: `updated ${quoted(name)} (status: ${status.replace("_", " ")})`,
    adminsOnly: true,
  });
  revalidatePath(`/admin/clients/${orgId}`);
  revalidatePath("/admin/clients");
}

/**
 * Cascades to delete every project, board, file, decision, etc. under this
 * org at the database level — but Postgres cascade only removes rows, not
 * the actual blobs sitting in Supabase Storage, so those are removed
 * explicitly first or they'd be orphaned (and billed) forever.
 */
export async function deleteOrganization(orgId: string) {
  await requireAxelAdmin();
  const doomed = await entityInfo("organizations", orgId, "name", false);
  const supabase = await createClient();

  const { data: projects } = await supabase.from("projects").select("id").eq("org_id", orgId);
  const projectIds = (projects ?? []).map((p) => p.id);

  if (projectIds.length) {
    const { data: files } = await supabase
      .from("files")
      .select("storage_path")
      .in("project_id", projectIds);
    const filePaths = (files ?? []).map((f) => f.storage_path).filter(Boolean);
    if (filePaths.length) {
      await supabase.storage.from("project-files").remove(filePaths);
    }
  }

  const { data: contracts } = await supabase
    .from("contracts")
    .select("signed_pdf_storage_path")
    .eq("org_id", orgId)
    .not("signed_pdf_storage_path", "is", null);
  const contractPaths = (contracts ?? [])
    .map((c) => c.signed_pdf_storage_path)
    .filter((p): p is string => Boolean(p));
  if (contractPaths.length) {
    await supabase.storage.from("org-documents").remove(contractPaths);
  }

  const { error } = await supabase.from("organizations").delete().eq("id", orgId);
  if (error) {
    throw new Error(`Couldn't delete client: ${error.message}`);
  }
  // The client is gone, so this one goes out without an org attached.
  await recordActivity({ kind: "client", message: `deleted the client ${quoted(doomed.name)}`, adminsOnly: true });
  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

const DEFAULT_COLUMNS = ["To do", "In progress", "Waiting on you", "Done"];
const DEFAULT_FOLDERS = [
  "Formulation Data",
  "Characterisation Results",
  "Reports",
  "Reference Materials",
];

export async function createProject(orgId: string, formData: FormData) {
  await requireAxelAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const engagementNote = String(formData.get("engagement_note") ?? "").trim();
  if (!name) {
    throw new Error("Project name is required.");
  }

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      org_id: orgId,
      name,
      start_date: startDate || null,
      engagement_note: engagementNote || null,
    })
    .select("id")
    .single();
  if (error || !project) {
    throw new Error(`Couldn't create project: ${error?.message ?? "unknown error"}`);
  }

  const { error: columnsError } = await supabase.from("board_columns").insert(
    DEFAULT_COLUMNS.map((colName, i) => ({
      project_id: project.id,
      name: colName,
      position: i,
    }))
  );
  if (columnsError) {
    throw new Error(`Project created, but couldn't set up its board: ${columnsError.message}`);
  }

  const { error: foldersError } = await supabase.from("folders").insert(
    DEFAULT_FOLDERS.map((folderName) => ({
      project_id: project.id,
      name: folderName,
    }))
  );
  if (foldersError) {
    throw new Error(`Project created, but couldn't set up its folders: ${foldersError.message}`);
  }

  await recordActivity({ kind: "project", projectId: project.id, orgId, message: `started the project ${quoted(name)}` });
  revalidatePath(`/admin/clients/${orgId}`);
}

export async function updateProject(orgId: string, projectId: string, formData: FormData) {
  await requireAxelAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const status = String(formData.get("status") ?? "active");
  const progressPct = Number(formData.get("progress_pct") ?? 0);
  const startDate = String(formData.get("start_date") ?? "").trim();
  const engagementNote = String(formData.get("engagement_note") ?? "").trim();
  if (!name) {
    throw new Error("Project name is required.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      name,
      status,
      progress_pct: Number.isFinite(progressPct) ? Math.min(100, Math.max(0, progressPct)) : 0,
      start_date: startDate || null,
      engagement_note: engagementNote || null,
    })
    .eq("id", projectId);
  if (error) {
    throw new Error(`Couldn't save project: ${error.message}`);
  }
  await recordActivity({
    kind: "project",
    projectId,
    orgId,
    message:
      status === "completed"
        ? `marked the project ${quoted(name)} as completed`
        : `updated the project ${quoted(name)} (${Math.min(100, Math.max(0, Math.round(progressPct || 0)))}% done)`,
  });
  revalidatePath(`/admin/clients/${orgId}`);
}

/**
 * Cascades to delete the project's board, files, decisions, meetings, etc.
 * at the database level — Storage blobs are removed explicitly first (see
 * deleteOrganization above for why).
 */
export async function deleteProject(orgId: string, projectId: string) {
  await requireAxelAdmin();
  const doomed = await entityInfo("projects", projectId, "name", false);
  const supabase = await createClient();

  const { data: files } = await supabase
    .from("files")
    .select("storage_path")
    .eq("project_id", projectId);
  const filePaths = (files ?? []).map((f) => f.storage_path).filter(Boolean);
  if (filePaths.length) {
    await supabase.storage.from("project-files").remove(filePaths);
  }

  const { data: contracts } = await supabase
    .from("contracts")
    .select("signed_pdf_storage_path")
    .eq("project_id", projectId)
    .not("signed_pdf_storage_path", "is", null);
  const contractPaths = (contracts ?? [])
    .map((c) => c.signed_pdf_storage_path)
    .filter((p): p is string => Boolean(p));
  if (contractPaths.length) {
    await supabase.storage.from("org-documents").remove(contractPaths);
  }

  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) {
    throw new Error(`Couldn't delete project: ${error.message}`);
  }
  await recordActivity({ kind: "project", orgId, message: `deleted the project ${quoted(doomed.name)}` });
  revalidatePath(`/admin/clients/${orgId}`);
}
