"use server";

import { revalidatePath } from "next/cache";
import { requireAxelAdmin, requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { notifyAxel } from "@/lib/notify-axel";
import { isDeliverableStatus, type DeliverableStatus } from "@/lib/deliverables";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TITLE = 200;
const MAX_DESCRIPTION = 5000;
const MAX_NOTE = 2000;

/**
 * Revalidates the admin and client views of a project's deliverables. The
 * paths are derived on the server from the project, never taken from the
 * browser, and the portal layout is refreshed too so the sidebar counter
 * stays right.
 */
function revalidateDeliverables(orgId: string, projectId: string) {
  revalidatePath(`/admin/clients/${orgId}/projects/${projectId}/deliverables`);
  revalidatePath("/portal/deliverables");
  revalidatePath("/portal", "layout");
}

async function getProjectOrg(supabase: Supabase, projectId: string) {
  const { data } = await supabase
    .from("projects")
    .select("org_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!data) throw new Error("Project not found.");
  return data.org_id as string;
}

async function getDeliverable(supabase: Supabase, deliverableId: string) {
  const { data } = await supabase
    .from("deliverables")
    .select("id, project_id, title, status")
    .eq("id", deliverableId)
    .maybeSingle();
  if (!data) throw new Error("Deliverable not found.");
  return data as { id: string; project_id: string; title: string; status: DeliverableStatus };
}

function parseFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");

  if (!title) throw new Error("A deliverable needs a title.");
  if (title.length > MAX_TITLE) throw new Error(`Keep the title under ${MAX_TITLE} characters.`);
  if (description.length > MAX_DESCRIPTION) {
    throw new Error(`Keep the description under ${MAX_DESCRIPTION} characters.`);
  }
  if (dueDate && !DATE_RE.test(dueDate)) throw new Error("That due date isn't valid.");
  if (!isDeliverableStatus(status)) throw new Error("That status isn't valid.");

  return { title, description: description || null, dueDate: dueDate || null, status };
}

/** Tells every accepted member of the client's workspace that something is ready for them. */
async function notifyClientMembers(
  supabase: Supabase,
  orgId: string,
  projectId: string,
  actorId: string,
  title: string
) {
  const { data: members } = await supabase
    .from("org_memberships")
    .select("user_id")
    .eq("org_id", orgId)
    .not("user_id", "is", null)
    .not("accepted_at", "is", null);

  const rows = (members ?? []).map((m) => ({
    recipient_id: m.user_id as string,
    actor_id: actorId,
    project_id: projectId,
    org_id: orgId,
    message: `Ready for your review: "${title}"`,
    kind: "deliverable",
  }));
  if (rows.length) {
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) console.error("notifyClientMembers: failed", error);
  }
}

export async function createDeliverable(projectId: string, formData: FormData) {
  await requireAxelAdmin();
  const user = await requireSessionUser();
  const fields = parseFields(formData);

  const supabase = await createClient();
  const orgId = await getProjectOrg(supabase, projectId);

  const { error } = await supabase.from("deliverables").insert({
    project_id: projectId,
    title: fields.title,
    description: fields.description,
    due_date: fields.dueDate,
    status: fields.status,
    submitted_at: fields.status === "in_review" ? new Date().toISOString() : null,
    created_by: user.id,
  });
  if (error) throw new Error(`Couldn't create the deliverable: ${error.message}`);

  if (fields.status === "in_review") {
    await notifyClientMembers(supabase, orgId, projectId, user.id, fields.title);
  }
  revalidateDeliverables(orgId, projectId);
}

export async function updateDeliverable(deliverableId: string, formData: FormData) {
  await requireAxelAdmin();
  const user = await requireSessionUser();
  const fields = parseFields(formData);

  const supabase = await createClient();
  const current = await getDeliverable(supabase, deliverableId);
  const orgId = await getProjectOrg(supabase, current.project_id);
  const now = new Date().toISOString();

  const update: Record<string, unknown> = {
    title: fields.title,
    description: fields.description,
    due_date: fields.dueDate,
    status: fields.status,
    updated_at: now,
  };

  const statusChanged = fields.status !== current.status;
  if (statusChanged && fields.status === "in_review") {
    // A fresh submission: the previous review (if any) no longer applies.
    update.submitted_at = now;
    update.reviewed_at = null;
    update.reviewed_by = null;
    update.review_note = null;
  }
  if (statusChanged && fields.status === "approved") {
    // Approved on the client's behalf (e.g. agreed on a call).
    update.reviewed_at = now;
    update.reviewed_by = user.id;
  }

  const { error } = await supabase.from("deliverables").update(update).eq("id", deliverableId);
  if (error) throw new Error(`Couldn't save the deliverable: ${error.message}`);

  if (statusChanged && fields.status === "in_review") {
    await notifyClientMembers(supabase, orgId, current.project_id, user.id, fields.title);
  }
  revalidateDeliverables(orgId, current.project_id);
}

export async function deleteDeliverable(deliverableId: string) {
  await requireAxelAdmin();
  const supabase = await createClient();
  const current = await getDeliverable(supabase, deliverableId);
  const orgId = await getProjectOrg(supabase, current.project_id);

  const { error } = await supabase.from("deliverables").delete().eq("id", deliverableId);
  if (error) throw new Error(`Couldn't delete the deliverable: ${error.message}`);
  revalidateDeliverables(orgId, current.project_id);
}

export async function attachDeliverableFile(deliverableId: string, formData: FormData) {
  await requireAxelAdmin();
  const fileId = String(formData.get("file_id") ?? "").trim();
  if (!fileId) return;

  const supabase = await createClient();
  const current = await getDeliverable(supabase, deliverableId);
  const orgId = await getProjectOrg(supabase, current.project_id);

  // The file must belong to this same project — RLS alone would let an admin
  // attach any file in the system, including another client's.
  const { data: file } = await supabase
    .from("files")
    .select("id")
    .eq("id", fileId)
    .eq("project_id", current.project_id)
    .maybeSingle();
  if (!file) throw new Error("That file isn't part of this project.");

  const { error } = await supabase
    .from("deliverable_files")
    .upsert({ deliverable_id: deliverableId, file_id: fileId }, { onConflict: "deliverable_id,file_id" });
  if (error) throw new Error(`Couldn't attach the file: ${error.message}`);
  revalidateDeliverables(orgId, current.project_id);
}

export async function detachDeliverableFile(deliverableId: string, fileId: string) {
  await requireAxelAdmin();
  const supabase = await createClient();
  const current = await getDeliverable(supabase, deliverableId);
  const orgId = await getProjectOrg(supabase, current.project_id);

  const { error } = await supabase
    .from("deliverable_files")
    .delete()
    .eq("deliverable_id", deliverableId)
    .eq("file_id", fileId);
  if (error) throw new Error(`Couldn't remove the file: ${error.message}`);
  revalidateDeliverables(orgId, current.project_id);
}

/** `note` echoes back what the client typed when a response fails, so React's form reset doesn't wipe it. */
export type ReviewState = { ok: boolean; message: string; note?: string } | null;

// Messages raised by review_deliverable() that are safe and useful to show as-is.
const SAFE_REVIEW_ERRORS = [
  "Only the workspace owner can review deliverables",
  "This deliverable is not awaiting review",
  "Tell us what needs to change",
  "Deliverable not found",
];

/**
 * The client's response to a deliverable: approve it, or ask for changes
 * (with a note). Goes through the review_deliverable() database function,
 * which re-checks that the caller is the workspace owner and that the
 * deliverable is actually awaiting review.
 */
export async function reviewDeliverable(
  deliverableId: string,
  _previous: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  await requireSessionUser();

  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (decision !== "approved" && decision !== "changes_requested") {
    return { ok: false, message: "Choose whether to approve or request changes.", note };
  }
  if (decision === "changes_requested" && !note) {
    return { ok: false, message: "Tell us what needs to change.", note };
  }
  if (note.length > MAX_NOTE) {
    return { ok: false, message: `Keep your note under ${MAX_NOTE} characters.`, note };
  }

  const supabase = await createClient();
  const current = await getDeliverable(supabase, deliverableId).catch(() => null);
  if (!current) return { ok: false, message: "We couldn't find that deliverable.", note };

  const { error } = await supabase.rpc("review_deliverable", {
    p_deliverable: deliverableId,
    p_decision: decision,
    p_note: note || null,
  });
  if (error) {
    const known = SAFE_REVIEW_ERRORS.find((m) => error.message.includes(m));
    return { ok: false, message: known ?? "We couldn't save your response. Please try again.", note };
  }

  const orgId = await getProjectOrg(supabase, current.project_id);
  const { data: org } = await supabase.from("organizations").select("name").eq("id", orgId).maybeSingle();
  await notifyAxel(
    `Deliverable ${decision === "approved" ? "approved" : "needs changes"}${org?.name ? ` — ${org.name}` : ""}`,
    [
      `"${current.title}" was ${decision === "approved" ? "approved" : "sent back with changes requested"}.`,
      note ? `\n${note}` : "",
    ]
  );

  revalidateDeliverables(orgId, current.project_id);
  return {
    ok: true,
    message:
      decision === "approved"
        ? "Approved — thank you."
        : "Thanks — we'll revise it and send it back for review.",
  };
}
