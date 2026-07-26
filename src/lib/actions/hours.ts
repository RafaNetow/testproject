"use server";

import { revalidatePath } from "next/cache";
import { requireAxelAdmin, requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

function revalidateAll(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

export async function logHours(projectId: string, paths: string[], formData: FormData) {
  await requireAxelAdmin();
  const user = await requireSessionUser();

  const entryDate = String(formData.get("entry_date") ?? "").trim();
  const hours = Number(formData.get("hours") ?? 0);
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const billable = formData.get("billable") === "on";
  if (!entryDate || !Number.isFinite(hours) || hours <= 0) {
    throw new Error("Enter a date and a valid number of hours.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("hours_entries").insert({
    project_id: projectId,
    logged_by: user.id,
    entry_date: entryDate,
    hours,
    category: category || null,
    description: description || null,
    billable,
  });
  if (error) {
    throw new Error(`Couldn't log hours: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function updateHoursEntry(entryId: string, paths: string[], formData: FormData) {
  await requireAxelAdmin();

  const entryDate = String(formData.get("entry_date") ?? "").trim();
  const hours = Number(formData.get("hours") ?? 0);
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const billable = formData.get("billable") === "on";
  if (!entryDate || !Number.isFinite(hours) || hours <= 0) {
    throw new Error("Enter a date and a valid number of hours.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("hours_entries")
    .update({
      entry_date: entryDate,
      hours,
      category: category || null,
      description: description || null,
      billable,
    })
    .eq("id", entryId);
  if (error) {
    throw new Error(`Couldn't update entry: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function deleteHoursEntry(entryId: string, paths: string[]) {
  await requireAxelAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("hours_entries").delete().eq("id", entryId);
  if (error) {
    throw new Error(`Couldn't delete entry: ${error.message}`);
  }
  revalidateAll(paths);
}
