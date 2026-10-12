"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { recordActivity, entityInfo, quoted } from "@/lib/activity";
import { detectTechnique } from "@/lib/techniques";

const BUCKET = "project-files";

function revalidateAll(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

export type UploadAttachResult = {
  success: boolean;
  message?: string;
};

/** Uploads a new file straight into storage and attaches it to the card in
 * one step, for when the file doesn't exist in the project yet — no need to
 * go to Files first and come back to pick it. */
export async function uploadAndAttachCardFile(
  projectId: string,
  cardId: string,
  paths: string[],
  formData: FormData
): Promise<UploadAttachResult> {
  const user = await requireSessionUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Choose a file to upload." };
  }
  const folderId = String(formData.get("folder_id") ?? "").trim() || null;

  const supabase = await createClient();
  const storagePath = `${projectId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });
  if (uploadError) {
    return { success: false, message: `Couldn't upload file: ${uploadError.message}` };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("files")
    .insert({
      project_id: projectId,
      folder_id: folderId,
      storage_path: storagePath,
      filename: file.name,
      size_bytes: file.size,
      mime_type: file.type || null,
      uploaded_by: user.id,
      technique: detectTechnique(file.name),
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { success: false, message: `Couldn't save file record: ${insertError?.message}` };
  }

  const { error: attachError } = await supabase
    .from("board_card_files")
    .insert({ card_id: cardId, file_id: inserted.id });
  if (attachError) {
    return { success: false, message: `Uploaded, but couldn't attach it: ${attachError.message}` };
  }

  const card = await entityInfo("board_cards", cardId, "title");
  await recordActivity({ kind: "card", cardId, message: `attached ${quoted(file.name)} to ${quoted(card.name)}` });

  revalidateAll(paths);
  return { success: true, message: `"${file.name}" uploaded and attached.` };
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

  const column = await entityInfo("board_columns", columnId, "name", false);
  await recordActivity({ kind: "card", projectId, message: `added ${quoted(title)} to ${column.name ?? "the board"}` });
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

  const { data: before } = await supabase
    .from("board_cards")
    .select("id, title, column_id, project_id")
    .in("id", orderedCardIds);

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

  const moved = (before ?? []).filter((c) => c.column_id !== columnId);
  if (moved.length) {
    const column = await entityInfo("board_columns", columnId, "name", false);
    for (const card of moved) {
      await recordActivity({ kind: "card", cardId: card.id, message: `moved ${quoted(card.title)} to ${column.name ?? "another column"}` });
    }
  }
  revalidateAll(paths);
}

export async function updateCardTitle(cardId: string, paths: string[], formData: FormData) {
  await requireSessionUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const previous = await entityInfo("board_cards", cardId, "title");
  if (previous.name === title) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("board_cards")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", cardId);
  if (error) {
    throw new Error(`Couldn't rename card: ${error.message}`);
  }
  await recordActivity({ kind: "card", cardId, message: `renamed ${quoted(previous.name)} to ${quoted(title)}` });
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
  const card = await entityInfo("board_cards", cardId, "title");
  await recordActivity({
    kind: "card",
    cardId,
    message: dueDate
      ? `set ${quoted(card.name)} due on ${new Date(`${dueDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
      : `removed the due date from ${quoted(card.name)}`,
  });
  revalidateAll(paths);
}

export async function updateCardDescription(cardId: string, paths: string[], formData: FormData) {
  await requireSessionUser();
  const description = String(formData.get("description") ?? "").trim();

  const previous = await entityInfo("board_cards", cardId, "description");
  if ((previous.name ?? "") === description) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("board_cards")
    .update({ description: description || null, updated_at: new Date().toISOString() })
    .eq("id", cardId);
  if (error) {
    throw new Error(`Couldn't save description: ${error.message}`);
  }
  const card = await entityInfo("board_cards", cardId, "title");
  await recordActivity({ kind: "card", cardId, message: `updated the description of ${quoted(card.name)}` });
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
  const [card, person] = await Promise.all([
    entityInfo("board_cards", cardId, "title"),
    entityInfo("profiles", profileId, "full_name", false),
  ]);
  const who = person.name?.trim() || "someone";
  await recordActivity({
    kind: "card",
    cardId,
    message: isAssigned ? `unassigned ${who} from ${quoted(card.name)}` : `assigned ${who} to ${quoted(card.name)}`,
  });
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
  const titled = await entityInfo("board_cards", cardId, "title");
  await recordActivity({ kind: "card", cardId, message: `labelled ${quoted(titled.name)} as ${tag}` });
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
  const titled = await entityInfo("board_cards", cardId, "title");
  await recordActivity({ kind: "card", cardId, message: `removed the ${tag} label from ${quoted(titled.name)}` });
  revalidateAll(paths);
}

export async function addCardComment(
  cardId: string,
  parentCommentId: string | null,
  paths: string[],
  formData: FormData
) {
  const user = await requireSessionUser();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("board_card_comments")
    .insert({ card_id: cardId, author_id: user.id, body, parent_comment_id: parentCommentId });
  if (error) {
    throw new Error(`Couldn't post comment: ${error.message}`);
  }

  const card = await entityInfo("board_cards", cardId, "title");
  await recordActivity({
    kind: "card",
    cardId,
    message: `${parentCommentId ? "replied on" : "commented on"} ${quoted(card.name)}: ${quoted(body)}`,
  });

  revalidateAll(paths);
}

export async function deleteCardComment(commentId: string, paths: string[]) {
  await requireSessionUser();
  const supabase = await createClient();
  const { data: comment } = await supabase
    .from("board_card_comments")
    .select("card_id")
    .eq("id", commentId)
    .maybeSingle();
  const { error } = await supabase.from("board_card_comments").delete().eq("id", commentId);
  if (error) {
    throw new Error(`Couldn't delete comment: ${error.message}`);
  }
  if (comment?.card_id) {
    const card = await entityInfo("board_cards", comment.card_id, "title");
    await recordActivity({ kind: "card", cardId: comment.card_id, message: `deleted a comment on ${quoted(card.name)}` });
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
  const card = await entityInfo("board_cards", cardId, "title");
  await recordActivity({ kind: "card", cardId, message: `attached the link ${quoted(label || url)} to ${quoted(card.name)}` });
  revalidateAll(paths);
}

export async function deleteCardLink(linkId: string, paths: string[]) {
  await requireSessionUser();
  const supabase = await createClient();
  const { data: link } = await supabase
    .from("board_card_links")
    .select("card_id, url, label")
    .eq("id", linkId)
    .maybeSingle();
  const { error } = await supabase.from("board_card_links").delete().eq("id", linkId);
  if (error) {
    throw new Error(`Couldn't remove link: ${error.message}`);
  }
  if (link?.card_id) {
    const card = await entityInfo("board_cards", link.card_id, "title");
    await recordActivity({ kind: "card", cardId: link.card_id, message: `removed the link ${quoted(link.label || link.url)} from ${quoted(card.name)}` });
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
  const [card, file] = await Promise.all([
    entityInfo("board_cards", cardId, "title"),
    entityInfo("files", fileId, "filename"),
  ]);
  await recordActivity({ kind: "card", cardId, message: `attached ${quoted(file.name)} to ${quoted(card.name)}` });
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
  const [card, file] = await Promise.all([
    entityInfo("board_cards", cardId, "title"),
    entityInfo("files", fileId, "filename"),
  ]);
  await recordActivity({ kind: "card", cardId, message: `removed ${quoted(file.name)} from ${quoted(card.name)}` });
  revalidateAll(paths);
}

export async function deleteCard(cardId: string, paths: string[]) {
  await requireSessionUser();
  const card = await entityInfo("board_cards", cardId, "title");
  const supabase = await createClient();
  const { error } = await supabase.from("board_cards").delete().eq("id", cardId);
  if (error) {
    throw new Error(`Couldn't delete card: ${error.message}`);
  }
  await recordActivity({ kind: "card", projectId: card.projectId, message: `deleted the card ${quoted(card.name)}` });
  revalidateAll(paths);
}
