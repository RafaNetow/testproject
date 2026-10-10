"use server";

import { revalidatePath } from "next/cache";
import { requireAxelAdmin, requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { recordActivity, entityInfo, quoted } from "@/lib/activity";

function revalidateAll(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

export async function publishUpdate(projectId: string, paths: string[], formData: FormData) {
  await requireAxelAdmin();
  const user = await requireSessionUser();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) {
    throw new Error("Title and update text are required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("weekly_updates").insert({
    project_id: projectId,
    title,
    body,
    author_id: user.id,
  });
  if (error) {
    throw new Error(`Couldn't publish update: ${error.message}`);
  }
  await recordActivity({ kind: "update", projectId, message: `published the update ${quoted(title)}` });
  revalidateAll(paths);
}

export async function deleteUpdate(updateId: string, paths: string[]) {
  await requireAxelAdmin();
  const doomed = await entityInfo("weekly_updates", updateId, "title");
  const supabase = await createClient();
  const { error } = await supabase.from("weekly_updates").delete().eq("id", updateId);
  if (error) {
    throw new Error(`Couldn't delete update: ${error.message}`);
  }
  await recordActivity({ kind: "update", projectId: doomed.projectId, message: `deleted the update ${quoted(doomed.name)}` });
  revalidateAll(paths);
}
