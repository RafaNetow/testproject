"use server";

import { revalidatePath } from "next/cache";
import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

function revalidateAll(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

export async function createMeeting(projectId: string, paths: string[], formData: FormData) {
  await requireAxelAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const scheduledAt = String(formData.get("scheduled_at") ?? "").trim();
  const durationMinutes = Number(formData.get("duration_minutes") ?? 0);
  const zoomUrl = String(formData.get("zoom_url") ?? "").trim();
  if (!title || !scheduledAt) {
    throw new Error("Title and date/time are required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("meetings").insert({
    project_id: projectId,
    title,
    scheduled_at: new Date(scheduledAt).toISOString(),
    duration_minutes: durationMinutes > 0 ? durationMinutes : null,
    zoom_url: zoomUrl || null,
  });
  if (error) {
    throw new Error(`Couldn't schedule meeting: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function updateMeeting(meetingId: string, paths: string[], formData: FormData) {
  await requireAxelAdmin();

  const status = String(formData.get("status") ?? "upcoming");
  const notes = String(formData.get("notes") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("meetings")
    .update({ status, notes: notes || null })
    .eq("id", meetingId);
  if (error) {
    throw new Error(`Couldn't update meeting: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function deleteMeeting(meetingId: string, paths: string[]) {
  await requireAxelAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("meetings").delete().eq("id", meetingId);
  if (error) {
    throw new Error(`Couldn't delete meeting: ${error.message}`);
  }
  revalidateAll(paths);
}
