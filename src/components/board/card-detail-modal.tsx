"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import {
  X,
  Trash,
  Plus,
  CalendarBlank,
  ChatCircleDots,
  Paperclip,
  LinkSimple,
  UploadSimple,
  UserPlus,
  FileText,
  ArrowSquareOut,
  Tag,
} from "@phosphor-icons/react/dist/ssr";
import { ConfirmButton } from "@/components/confirm-button";
import { colorFor, initials } from "./board-colors";
import {
  updateCardTitle,
  updateCardDueDate,
  updateCardDescription,
  toggleCardAssignee,
  addCardTag,
  removeCardTag,
  addCardComment,
  deleteCardComment,
  addCardLink,
  deleteCardLink,
  attachCardFile,
  detachCardFile,
  uploadAndAttachCardFile,
  deleteCard,
  type UploadAttachResult,
} from "@/lib/actions/board";

type Member = { id: string; full_name: string | null };
type ProjectFile = { id: string; filename: string; url: string | null; mime_type: string | null };
type CardComment = {
  id: string;
  author_id: string | null;
  body: string;
  created_at: string;
  parent_comment_id: string | null;
};
type CardLink = { id: string; url: string; label: string | null };

export type ModalCard = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  due_date: string | null;
  column_id: string;
};

/** Closes the popover this form lives in right after a valid submit — native
 * required-field validation still blocks invalid submits from closing it. */
function closeParentDetails(e: React.SyntheticEvent<HTMLElement>) {
  e.currentTarget.closest("details")?.removeAttribute("open");
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB");
}

function SidebarBlock({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        <Icon size={12} />
        {label}
      </p>
      {children}
    </div>
  );
}

export function CardDetailModal({
  card,
  projectId,
  columnName,
  members,
  assigneeIds,
  comments,
  links,
  attachedFileIds,
  projectFiles,
  currentUserId,
  canDelete,
  paths,
  onClose,
}: {
  card: ModalCard | null;
  projectId: string;
  columnName: string;
  members: Member[];
  assigneeIds: string[];
  comments: CardComment[];
  links: CardLink[];
  attachedFileIds: string[];
  projectFiles: ProjectFile[];
  currentUserId: string;
  canDelete: boolean;
  paths: string[];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (card) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [card]);

  const memberById = new Map(members.map((m) => [m.id, m]));

  return (
    <dialog
      ref={dialogRef}
      className="card-detail-modal m-auto max-h-[85vh] w-[min(760px,94vw)] overflow-hidden rounded-2xl border border-border bg-card p-0 backdrop:bg-black/50"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialogRef.current?.close();
      }}
    >
      {card && (
        <CardDetailBody
          card={card}
          projectId={projectId}
          columnName={columnName}
          members={members}
          memberById={memberById}
          assigneeIds={assigneeIds}
          comments={comments}
          links={links}
          attachedFileIds={attachedFileIds}
          projectFiles={projectFiles}
          currentUserId={currentUserId}
          canDelete={canDelete}
          paths={paths}
          onRequestClose={() => dialogRef.current?.close()}
        />
      )}
    </dialog>
  );
}

function CardDetailBody({
  card,
  projectId,
  columnName,
  members,
  memberById,
  assigneeIds,
  comments,
  links,
  attachedFileIds,
  projectFiles,
  currentUserId,
  canDelete,
  paths,
  onRequestClose,
}: {
  card: ModalCard;
  projectId: string;
  columnName: string;
  members: Member[];
  memberById: Map<string, Member>;
  assigneeIds: string[];
  comments: CardComment[];
  links: CardLink[];
  attachedFileIds: string[];
  projectFiles: ProjectFile[];
  currentUserId: string;
  canDelete: boolean;
  paths: string[];
  onRequestClose: () => void;
}) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const assignees = assigneeIds.map((id) => memberById.get(id)).filter(Boolean) as Member[];
  const attached = projectFiles.filter((f) => attachedFileIds.includes(f.id));
  const attachable = projectFiles.filter((f) => !attachedFileIds.includes(f.id));
  const topLevelComments = comments.filter((c) => !c.parent_comment_id);
  const repliesByParent = new Map<string, CardComment[]>();
  for (const c of comments) {
    if (c.parent_comment_id) {
      repliesByParent.set(c.parent_comment_id, [...(repliesByParent.get(c.parent_comment_id) ?? []), c]);
    }
  }

  const renameThisCard = updateCardTitle.bind(null, card.id, paths);
  const setThisDueDate = updateCardDueDate.bind(null, card.id, paths);
  const saveThisDescription = updateCardDescription.bind(null, card.id, paths);
  const addThisTag = addCardTag.bind(null, card.id, paths);
  const addThisLink = addCardLink.bind(null, card.id, paths);
  const deleteThisCard = deleteCard.bind(null, card.id, paths);

  function CommentBubble({ comment }: { comment: CardComment }) {
    const author = comment.author_id ? memberById.get(comment.author_id) : undefined;
    const isMine = comment.author_id === currentUserId;
    const removeThis = deleteCardComment.bind(null, comment.id, paths);
    const color = comment.author_id ? colorFor(comment.author_id) : null;

    return (
      <div className="flex items-start gap-2.5">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-medium ${
            color ? `${color.bg} ${color.text}` : "bg-muted text-muted-foreground"
          }`}
        >
          {initials(author?.full_name ?? null)}
        </span>
        <div className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-primary">
              {isMine ? "You" : (author?.full_name ?? "Unknown")}
              <span className="ml-2 font-normal text-muted-foreground">{timeAgo(comment.created_at)}</span>
            </p>
            {isMine && (
              <form action={removeThis}>
                <button
                  type="submit"
                  aria-label="Delete comment"
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <X size={12} />
                </button>
              </form>
            )}
          </div>
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-secondary">{comment.body}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
            In {columnName}
          </p>
          <form action={renameThisCard} className="mt-1">
            <input
              name="title"
              defaultValue={card.title}
              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              className="-mx-1 w-full rounded-md border border-transparent bg-transparent px-1 font-display text-lg font-medium text-primary outline-none transition-colors focus:border-accent focus:bg-background"
            />
          </form>
        </div>
        <button
          type="button"
          onClick={onRequestClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          aria-label="Close card"
        >
          <X size={17} />
        </button>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-x-8 gap-y-6 overflow-y-auto px-6 py-5 md:grid-cols-[1fr_200px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Description
            </p>
            <form action={saveThisDescription} className="flex flex-col gap-2">
              <textarea
                name="description"
                defaultValue={card.description ?? ""}
                placeholder="Add a more detailed description…"
                rows={3}
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-relaxed text-primary outline-none transition-colors focus:border-accent"
              />
              <button
                type="submit"
                className="self-start rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-muted"
              >
                Save
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              <Paperclip size={12} />
              Attachments
            </p>

            {(attached.length > 0 || links.length > 0) && (
              <div className="flex flex-col gap-1.5">
                {attached.map((f) => {
                  const detach = detachCardFile.bind(null, card.id, f.id, paths);
                  return (
                    <div
                      key={f.id}
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <FileText size={16} className="shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm text-primary">{f.filename}</span>
                      {f.url && (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
                          aria-label={`Open ${f.filename}`}
                        >
                          <ArrowSquareOut size={14} />
                        </a>
                      )}
                      <form action={detach}>
                        <button
                          type="submit"
                          aria-label={`Remove attachment ${f.filename}`}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X size={14} />
                        </button>
                      </form>
                    </div>
                  );
                })}

                {links.map((l) => {
                  const removeThis = deleteCardLink.bind(null, l.id, paths);
                  return (
                    <div
                      key={l.id}
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <LinkSimple size={16} className="shrink-0 text-muted-foreground" />
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 flex-1 truncate text-sm text-accent hover:underline"
                      >
                        {l.label || l.url}
                      </a>
                      <form action={removeThis}>
                        <button
                          type="submit"
                          aria-label="Remove link"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X size={14} />
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {attachable.length > 0 && (
                <details className="group relative">
                  <summary className="inline-flex list-none items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-muted">
                    <FileText size={13} />
                    Existing file
                  </summary>
                  <div className="absolute left-0 z-20 mt-2 flex max-h-56 w-64 flex-col gap-0.5 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-lg">
                    {attachable.map((f) => {
                      const attach = attachCardFile.bind(null, card.id, f.id, paths);
                      return (
                        <form action={attach} key={f.id} onSubmit={closeParentDetails}>
                          <button
                            type="submit"
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-secondary transition-colors hover:bg-muted hover:text-primary"
                          >
                            <FileText size={14} className="shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate">{f.filename}</span>
                          </button>
                        </form>
                      );
                    })}
                  </div>
                </details>
              )}

              <UploadAttachmentForm projectId={projectId} cardId={card.id} paths={paths} />

              <details className="group relative">
                <summary className="inline-flex list-none items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-muted">
                  <LinkSimple size={13} />
                  Link
                </summary>
                <form
                  action={addThisLink}
                  onSubmit={closeParentDetails}
                  className="absolute left-0 z-20 mt-2 flex w-64 flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-lg"
                >
                  <input
                    name="url"
                    required
                    placeholder="https://…"
                    className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-primary outline-none focus:border-accent"
                  />
                  <input
                    name="label"
                    placeholder="Label (optional)"
                    className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-primary outline-none focus:border-accent"
                  />
                  <button type="submit" className="btn-primary rounded-md py-1.5 text-xs font-medium">
                    Attach
                  </button>
                </form>
              </details>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              <ChatCircleDots size={12} />
              Comments
            </p>

            <div className="flex flex-col gap-4">
              {topLevelComments.map((c) => {
                const replies = repliesByParent.get(c.id) ?? [];
                const addThisReply = addCardComment.bind(null, card.id, c.id, paths);
                return (
                  <div key={c.id} className="flex flex-col gap-2">
                    <CommentBubble comment={c} />
                    <div className="ml-9 flex flex-col gap-2">
                      {replies.map((r) => (
                        <CommentBubble key={r.id} comment={r} />
                      ))}
                      {replyingTo === c.id ? (
                        <form
                          action={async (formData) => {
                            await addThisReply(formData);
                            setReplyingTo(null);
                          }}
                          className="flex flex-col gap-1.5"
                        >
                          <textarea
                            name="body"
                            required
                            autoFocus
                            rows={2}
                            placeholder="Write a reply…"
                            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none transition-colors focus:border-accent"
                          />
                          <div className="flex items-center gap-3">
                            <button
                              type="submit"
                              className="btn-primary rounded-full px-3.5 py-1 text-xs font-medium"
                            >
                              Reply
                            </button>
                            <button
                              type="button"
                              onClick={() => setReplyingTo(null)}
                              className="text-xs font-medium text-muted-foreground hover:text-primary"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReplyingTo(c.id)}
                          className="self-start text-xs font-medium text-muted-foreground transition-colors hover:text-accent"
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <form action={addCardComment.bind(null, card.id, null, paths)} className="flex flex-col gap-2">
              <textarea
                name="body"
                required
                placeholder="Write a comment…"
                rows={2}
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
              />
              <button
                type="submit"
                className="btn-primary self-start rounded-full px-4 py-1.5 text-xs font-medium"
              >
                Comment
              </button>
            </form>
          </div>

          {canDelete && (
            <div className="border-t border-border pt-4">
              <form action={deleteThisCard}>
                <ConfirmButton
                  confirmText={`Delete "${card.title}"? This can't be undone.`}
                  ariaLabel={`Delete card "${card.title}"`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive/70 transition-colors hover:text-destructive"
                >
                  <Trash size={14} />
                  Delete this card
                </ConfirmButton>
              </form>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5 md:border-l md:border-border md:pl-6">
          <SidebarBlock icon={UserPlus} label="Assignees">
            <div className="flex flex-wrap items-center gap-1.5">
              {assignees.map((m) => {
                const color = colorFor(m.id);
                return (
                  <span
                    key={m.id}
                    title={m.full_name ?? "Unnamed"}
                    className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-[10px] font-medium ${color.bg} ${color.text}`}
                  >
                    {initials(m.full_name)}
                  </span>
                );
              })}
              <details className="group relative">
                <summary className="flex h-7 w-7 list-none items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent">
                  <Plus size={13} weight="bold" />
                </summary>
                <div className="absolute left-0 z-20 mt-2 flex w-52 flex-col gap-0.5 rounded-xl border border-border bg-card p-1.5 shadow-lg">
                  {members.length === 0 && (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">No members yet.</p>
                  )}
                  {members.map((m) => {
                    const isAssigned = assigneeIds.includes(m.id);
                    const toggle = toggleCardAssignee.bind(null, card.id, m.id, isAssigned, paths);
                    return (
                      <form action={toggle} key={m.id} onSubmit={closeParentDetails}>
                        <button
                          type="submit"
                          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
                            isAssigned ? "text-primary" : "text-secondary"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-medium ${colorFor(m.id).bg} ${colorFor(m.id).text}`}
                          >
                            {initials(m.full_name)}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{m.full_name ?? "Unnamed"}</span>
                          {isAssigned && <span className="shrink-0 text-accent">✓</span>}
                        </button>
                      </form>
                    );
                  })}
                </div>
              </details>
            </div>
          </SidebarBlock>

          <SidebarBlock icon={Tag} label="Labels">
            <div className="flex flex-wrap items-center gap-1.5">
              {card.tags.map((tag) => {
                const color = colorFor(tag);
                const removeThis = removeCardTag.bind(null, card.id, tag, paths);
                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide ${color.bg} ${color.text}`}
                  >
                    {tag}
                    <form action={removeThis}>
                      <button
                        type="submit"
                        aria-label={`Remove label ${tag}`}
                        className="opacity-60 hover:opacity-100"
                      >
                        <X size={10} weight="bold" />
                      </button>
                    </form>
                  </span>
                );
              })}
              <details className="group relative">
                <summary className="flex list-none items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-accent hover:text-accent">
                  <Plus size={11} weight="bold" />
                  Add
                </summary>
                <form
                  action={addThisTag}
                  onSubmit={closeParentDetails}
                  className="absolute left-0 z-20 mt-2 flex w-48 gap-1.5 rounded-xl border border-border bg-card p-2 shadow-lg"
                >
                  <input
                    name="tag"
                    required
                    placeholder="e.g. urgent"
                    className="w-full min-w-0 rounded-md border border-border bg-background px-2 py-1 text-xs text-primary outline-none focus:border-accent"
                  />
                  <button type="submit" className="btn-primary shrink-0 rounded-md px-2 py-1 text-xs font-medium">
                    Add
                  </button>
                </form>
              </details>
            </div>
          </SidebarBlock>

          <SidebarBlock icon={CalendarBlank} label="Due date">
            <form action={setThisDueDate}>
              <input
                name="due_date"
                type="date"
                defaultValue={card.due_date ?? ""}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-primary outline-none transition-colors focus:border-accent"
              />
            </form>
          </SidebarBlock>
        </div>
      </div>
    </div>
  );
}

function UploadAttachmentForm({
  projectId,
  cardId,
  paths,
}: {
  projectId: string;
  cardId: string;
  paths: string[];
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [state, formAction, isPending] = useActionState<UploadAttachResult | null, FormData>(
    async (_prev, formData) => uploadAndAttachCardFile(projectId, cardId, paths, formData),
    null
  );

  useEffect(() => {
    if (state?.success) detailsRef.current?.removeAttribute("open");
  }, [state]);

  return (
    <details ref={detailsRef} className="group relative">
      <summary className="inline-flex list-none items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-muted">
        <UploadSimple size={13} />
        Upload a file
      </summary>
      <form
        action={formAction}
        className="absolute left-0 z-20 mt-2 flex w-64 flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-lg"
      >
        <input
          name="file"
          type="file"
          required
          className="w-full rounded-md border border-border bg-background text-xs text-primary outline-none file:mr-2 file:rounded-full file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-[11px] file:font-medium file:text-secondary focus:border-accent"
        />
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary rounded-md py-1.5 text-xs font-medium disabled:opacity-60"
        >
          {isPending ? "Uploading…" : "Upload & attach"}
        </button>
        {state && !state.success && (
          <p className="text-[11px] text-destructive">{state.message}</p>
        )}
      </form>
    </details>
  );
}
