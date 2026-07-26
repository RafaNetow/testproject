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

/**
 * Called once a drag settles (not on every hover) with the full ordered list
 * of card ids for the destination column — reindexes positions 0..n so the
 * exact order the user dropped into is what's persisted, across columns or
 * within one.
 */
export async function reorderCards(
  paths: string[],
  columnId: string,
  orderedCardIds: string[]
) {
  await requireSessionUser();
  const supabase = await createClient();

  const results = await Promise.all(
    orderedCardIds.map((id, index) =>
      supabase
        .from("board_cards")
        .update({
          column_id: columnId,
          position: index,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    throw new Error(`Couldn't reorder cards: ${failed.error.message}`);
  }
  revalidateAll(paths);
}

export async function updateCardTitle(cardId: string, paths: string[], formData: FormData) {
  await requireSessionUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("board_cards")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", cardId);
  if (error) {
    throw new Error(`Couldn't rename card: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function updateCardDueDate(cardId: string, paths: string[], formData: FormData) {
  await requireSessionUser();
  const dueDate = String(formData.get("due_date") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("board_cards")
    .update({ due_date: dueDate || null, updated_at: new Date().toISOString() })
    .eq("id", cardId);
  if (error) {
    throw new Error(`Couldn't set due date: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function updateCardDescription(cardId: string, paths: string[], formData: FormData) {
  await requireSessionUser();
  const description = String(formData.get("description") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("board_cards")
    .update({ description: description || null, updated_at: new Date().toISOString() })
    .eq("id", cardId);
  if (error) {
    throw new Error(`Couldn't save description: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function toggleCardAssignee(
  cardId: string,
  profileId: string,
  isAssigned: boolean,
  paths: string[]
) {
  await requireSessionUser();
  const supabase = await createClient();

  const { error } = isAssigned
    ? await supabase
        .from("board_card_assignees")
        .delete()
        .eq("card_id", cardId)
        .eq("profile_id", profileId)
    : await supabase.from("board_card_assignees").insert({ card_id: cardId, profile_id: profileId });

  if (error) {
    throw new Error(`Couldn't update assignee: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function addCardTag(cardId: string, paths: string[], formData: FormData) {
  await requireSessionUser();
  const tag = String(formData.get("tag") ?? "").trim();
  if (!tag) return;

  const supabase = await createClient();
  const { data: card } = await supabase
    .from("board_cards")
    .select("tags")
    .eq("id", cardId)
    .single();
  const existing: string[] = card?.tags ?? [];
  if (existing.includes(tag)) return;

  const { error } = await supabase
    .from("board_cards")
    .update({ tags: [...existing, tag], updated_at: new Date().toISOString() })
    .eq("id", cardId);
  if (error) {
    throw new Error(`Couldn't add tag: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function removeCardTag(cardId: string, tag: string, paths: string[]) {
  await requireSessionUser();
  const supabase = await createClient();
  const { data: card } = await supabase
    .from("board_cards")
    .select("tags")
    .eq("id", cardId)
    .single();
  const existing: string[] = card?.tags ?? [];

  const { error } = await supabase
    .from("board_cards")
    .update({
      tags: existing.filter((t) => t !== tag),
      updated_at: new Date().toISOString(),
    })
    .eq("id", cardId);
  if (error) {
    throw new Error(`Couldn't remove tag: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function addCardComment(cardId: string, paths: string[], formData: FormData) {
  const user = await requireSessionUser();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("board_card_comments")
    .insert({ card_id: cardId, author_id: user.id, body });
  if (error) {
    throw new Error(`Couldn't post comment: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function deleteCardComment(commentId: string, paths: string[]) {
  await requireSessionUser();
  const supabase = await createClient();
  const { error } = await supabase.from("board_card_comments").delete().eq("id", commentId);
  if (error) {
    throw new Error(`Couldn't delete comment: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function addCardLink(cardId: string, paths: string[], formData: FormData) {
  const user = await requireSessionUser();
  let url = String(formData.get("url") ?? "").trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const label = String(formData.get("label") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("board_card_links")
    .insert({ card_id: cardId, url, label: label || null, created_by: user.id });
  if (error) {
    throw new Error(`Couldn't attach link: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function deleteCardLink(linkId: string, paths: string[]) {
  await requireSessionUser();
  const supabase = await createClient();
  const { error } = await supabase.from("board_card_links").delete().eq("id", linkId);
  if (error) {
    throw new Error(`Couldn't remove link: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function attachCardFile(cardId: string, fileId: string, paths: string[]) {
  await requireSessionUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("board_card_files")
    .insert({ card_id: cardId, file_id: fileId });
  if (error) {
    throw new Error(`Couldn't attach file: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function detachCardFile(cardId: string, fileId: string, paths: string[]) {
  await requireSessionUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("board_card_files")
    .delete()
    .eq("card_id", cardId)
    .eq("file_id", fileId);
  if (error) {
    throw new Error(`Couldn't remove attachment: ${error.message}`);
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
