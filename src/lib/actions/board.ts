"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

function revalidateAll(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

export async function createCard(
  projectId: string,
  columnId: string,
  paths: string[],
  formData: FormData
) {
  await requireSessionUser();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const dueDate = String(formData.get("due_date") ?? "").trim();

  const supabase = await createClient();
  const { count } = await supabase
    .from("board_cards")
    .select("id", { count: "exact", head: true })
    .eq("column_id", columnId);

  const { error } = await supabase.from("board_cards").insert({
    project_id: projectId,
    column_id: columnId,
    title,
    due_date: dueDate || null,
    position: count ?? 0,
  });
  if (error) {
    throw new Error(`Couldn't add card: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function moveCard(cardId: string, paths: string[], formData: FormData) {
  await requireSessionUser();

  const columnId = String(formData.get("column_id") ?? "");
  if (!columnId) return;

  const supabase = await createClient();
  const { count } = await supabase
    .from("board_cards")
    .select("id", { count: "exact", head: true })
    .eq("column_id", columnId);

  const { error } = await supabase
    .from("board_cards")
    .update({ column_id: columnId, position: count ?? 0, updated_at: new Date().toISOString() })
    .eq("id", cardId);
  if (error) {
    throw new Error(`Couldn't move card: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function deleteCard(cardId: string, paths: string[]) {
  await requireSessionUser();
  const supabase = await createClient();
  const { error } = await supabase.from("board_cards").delete().eq("id", cardId);
  if (error) {
    throw new Error(`Couldn't delete card: ${error.message}`);
  }
  revalidateAll(paths);
}
