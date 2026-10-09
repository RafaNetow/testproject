"use client";

import { useState, type ReactNode } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MuiLink from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Add from "@mui/icons-material/Add";
import AttachFile from "@mui/icons-material/AttachFile";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import ChatBubbleOutlined from "@mui/icons-material/ChatBubbleOutlined";
import Check from "@mui/icons-material/Check";
import Close from "@mui/icons-material/Close";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import Download from "@mui/icons-material/Download";
import FolderOpenOutlined from "@mui/icons-material/FolderOpenOutlined";
import LabelOutlined from "@mui/icons-material/LabelOutlined";
import LinkIcon from "@mui/icons-material/Link";
import PersonAddAltOutlined from "@mui/icons-material/PersonAddAltOutlined";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import { ConfirmButton } from "@/components/confirm-button";
import { FileInput } from "@/components/shared/file-input";
import { Popover } from "@/components/shared/popover";
import { SelectField } from "@/components/shared/select-field";
import { timeAgo } from "@/lib/time-ago";
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
} from "@/lib/actions/board";

type Member = { id: string; full_name: string | null };
type Folder = { id: string; name: string };
type ProjectFile = {
  id: string;
  filename: string;
  folder_id: string | null;
  url: string | null;
  mime_type: string | null;
};
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

function fileHref(filesBaseUrl: string, folderId: string | null) {
  if (!folderId) return filesBaseUrl;
  const sep = filesBaseUrl.includes("?") ? "&" : "?";
  return `${filesBaseUrl}${sep}folder=${folderId}`;
}

const sectionLabelSx = {
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "text.muted",
} as const;

const smallIconSx = { width: 28, height: 28, color: "text.muted", "&:hover": { color: "primary.main" } } as const;
const removeIconSx = { width: 28, height: 28, color: "text.muted", "&:hover": { color: "error.main" } } as const;
const attachmentRowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  borderRadius: 2,
  border: 1,
  borderColor: "divider",
  bgcolor: "background.default",
  px: 1.5,
  py: 0.75,
} as const;

function SectionLabel({ icon: Icon, children }: { icon?: SvgIconComponent; children: ReactNode }) {
  return (
    <Typography component="h3" sx={sectionLabelSx}>
      {Icon && <Icon sx={{ fontSize: 13 }} />}
      {children}
    </Typography>
  );
}

function MemberAvatar({ member, size = 28 }: { member: Member | undefined; size?: number }) {
  const color = member ? colorFor(member.id) : null;
  return (
    <Avatar
      title={member?.full_name ?? "Unnamed"}
      sx={{
        width: size,
        height: size,
        fontFamily: "var(--font-mono)",
        fontSize: size <= 20 ? 9 : 10,
        fontWeight: 500,
        bgcolor: color?.bg ?? "var(--color-muted)",
        color: color?.text ?? "text.muted",
      }}
    >
      {initials(member?.full_name ?? null)}
    </Avatar>
  );
}

export function CardDetailModal({
  card,
  projectId,
  filesBaseUrl,
  folders,
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
  filesBaseUrl: string;
  folders: Folder[];
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
  const memberById = new Map(members.map((m) => [m.id, m]));

  return (
    <Dialog
      open={Boolean(card)}
      onClose={onClose}
      maxWidth={false}
      aria-label={card ? `Card: ${card.title}` : "Card"}
      slotProps={{ paper: { sx: { width: "min(760px, 94vw)", maxHeight: "85vh", m: 2 } } }}
    >
      {card && (
        <CardDetailBody
          key={card.id}
          card={card}
          projectId={projectId}
          filesBaseUrl={filesBaseUrl}
          folders={folders}
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
          onRequestClose={onClose}
        />
      )}
    </Dialog>
  );
}

function CardDetailBody({
  card,
  projectId,
  filesBaseUrl,
  folders,
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
  filesBaseUrl: string;
  folders: Folder[];
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

    return (
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
        <MemberAvatar member={author} />
        <Box sx={{ minWidth: 0, flex: 1, borderRadius: 2, border: 1, borderColor: "divider", bgcolor: "background.default", px: 1.5, py: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
              {isMine ? "You" : (author?.full_name ?? "Unknown")}
              <Box component="span" sx={{ ml: 1, fontWeight: 400, color: "text.muted" }}>
                {timeAgo(comment.created_at)}
              </Box>
            </Typography>
            {isMine && (
              <form action={removeThis}>
                <IconButton type="submit" size="small" aria-label="Delete comment" sx={{ ...removeIconSx, width: 22, height: 22 }}>
                  <Close sx={{ fontSize: 13 }} />
                </IconButton>
              </form>
            )}
          </Box>
          <Typography sx={{ mt: 0.25, whiteSpace: "pre-wrap", fontSize: 14, color: "text.secondary" }}>{comment.body}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", maxHeight: "85vh", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, borderBottom: 1, borderColor: "divider", px: 3, py: 2 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "primary.main" }}>
            {columnName}
          </Typography>
          <form action={renameThisCard}>
            <InputBase
              name="title"
              defaultValue={card.title}
              fullWidth
              inputProps={{ "aria-label": "Card title" }}
              onBlur={(e) => (e.currentTarget as HTMLInputElement).form?.requestSubmit()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).blur();
                }
              }}
              sx={{
                mt: 0.5,
                mx: -0.5,
                px: 0.5,
                borderRadius: 1,
                border: 1,
                borderColor: "transparent",
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 500,
                color: "text.primary",
                "&.Mui-focused": { borderColor: "primary.main", bgcolor: "background.default" },
              }}
            />
          </form>
        </Box>
        <IconButton size="small" aria-label="Close card" onClick={onRequestClose}>
          <Close sx={{ fontSize: 19 }} />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "grid",
          flex: 1,
          gridTemplateColumns: { xs: "1fr", md: "1fr 200px" },
          columnGap: 4,
          rowGap: 3,
          overflowY: "auto",
          px: 3,
          py: 2.5,
        }}
      >
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          <Stack spacing={1}>
            <SectionLabel>Description</SectionLabel>
            <Stack component="form" action={saveThisDescription} spacing={1}>
              <TextField
                name="description"
                defaultValue={card.description ?? ""}
                placeholder="Add a more detailed description…"
                multiline
                minRows={3}
                slotProps={{ htmlInput: { "aria-label": "Description" } }}
              />
              <Box>
                <Button type="submit" variant="outlined" color="secondary" size="small">
                  Save
                </Button>
              </Box>
            </Stack>
          </Stack>

          <Stack spacing={1.25}>
            <SectionLabel icon={AttachFile}>Attachments</SectionLabel>

            {(attached.length > 0 || links.length > 0) && (
              <Stack spacing={0.75}>
                {attached.map((f) => {
                  const detach = detachCardFile.bind(null, card.id, f.id, paths);
                  return (
                    <Box key={f.id} sx={attachmentRowSx}>
                      <DescriptionOutlined sx={{ fontSize: 17, color: "text.muted", flexShrink: 0 }} />
                      <Typography noWrap sx={{ minWidth: 0, flex: 1, fontSize: 14 }}>
                        {f.filename}
                      </Typography>
                      <IconButton component="a" href={fileHref(filesBaseUrl, f.folder_id)} size="small" title="View in Files" aria-label={`View ${f.filename} in Files`} sx={smallIconSx}>
                        <FolderOpenOutlined sx={{ fontSize: 15 }} />
                      </IconButton>
                      {f.url && (
                        <IconButton component="a" href={f.url} download={f.filename} size="small" title="Download" aria-label={`Download ${f.filename}`} sx={smallIconSx}>
                          <Download sx={{ fontSize: 15 }} />
                        </IconButton>
                      )}
                      <form action={detach}>
                        <IconButton type="submit" size="small" aria-label={`Remove attachment ${f.filename}`} sx={removeIconSx}>
                          <Close sx={{ fontSize: 15 }} />
                        </IconButton>
                      </form>
                    </Box>
                  );
                })}

                {links.map((l) => {
                  const removeThis = deleteCardLink.bind(null, l.id, paths);
                  return (
                    <Box key={l.id} sx={attachmentRowSx}>
                      <LinkIcon sx={{ fontSize: 17, color: "text.muted", flexShrink: 0 }} />
                      <MuiLink href={l.url} target="_blank" rel="noreferrer" sx={{ minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 14 }}>
                        {l.label || l.url}
                      </MuiLink>
                      <form action={removeThis}>
                        <IconButton type="submit" size="small" aria-label="Remove link" sx={removeIconSx}>
                          <Close sx={{ fontSize: 15 }} />
                        </IconButton>
                      </form>
                    </Box>
                  );
                })}
              </Stack>
            )}

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {attachable.length > 0 && (
                <Popover
                  trigger={({ toggle }) => (
                    <Button onClick={toggle} variant="outlined" color="secondary" size="small" startIcon={<DescriptionOutlined />}>
                      Existing file
                    </Button>
                  )}
                >
                  {(close) => (
                    <List dense sx={{ width: 256, maxHeight: 224, overflowY: "auto", p: 0.75 }}>
                      {attachable.map((f) => {
                        const attach = attachCardFile.bind(null, card.id, f.id, paths);
                        return (
                          <form action={attach} key={f.id} onSubmit={close}>
                            <ListItemButton component="button" type="submit" sx={{ width: "100%", borderRadius: 2 }}>
                              <ListItemIcon sx={{ minWidth: 26 }}>
                                <DescriptionOutlined sx={{ fontSize: 15 }} />
                              </ListItemIcon>
                              <ListItemText primary={f.filename} slotProps={{ primary: { noWrap: true, sx: { fontSize: 14 } } }} />
                            </ListItemButton>
                          </form>
                        );
                      })}
                    </List>
                  )}
                </Popover>
              )}

              <UploadAttachmentForm projectId={projectId} cardId={card.id} folders={folders} paths={paths} />

              <Popover
                trigger={({ toggle }) => (
                  <Button onClick={toggle} variant="outlined" color="secondary" size="small" startIcon={<LinkIcon />}>
                    Link
                  </Button>
                )}
              >
                {(close) => (
                  <Stack component="form" action={addThisLink} onSubmit={close} spacing={1.25} sx={{ width: 256, p: 1.5 }}>
                    <TextField name="url" label="URL" required placeholder="https://…" />
                    <TextField name="label" label="Label (optional)" />
                    <Button type="submit" variant="contained" size="small">
                      Attach
                    </Button>
                  </Stack>
                )}
              </Popover>
            </Box>
          </Stack>

          <Stack spacing={1.25}>
            <SectionLabel icon={ChatBubbleOutlined}>Comments</SectionLabel>

            <Stack spacing={2}>
              {topLevelComments.map((c) => {
                const replies = repliesByParent.get(c.id) ?? [];
                const addThisReply = addCardComment.bind(null, card.id, c.id, paths);
                return (
                  <Stack key={c.id} spacing={1}>
                    <CommentBubble comment={c} />
                    <Stack spacing={1} sx={{ ml: 4.5 }}>
                      {replies.map((r) => (
                        <CommentBubble key={r.id} comment={r} />
                      ))}
                      {replyingTo === c.id ? (
                        <Stack
                          component="form"
                          action={async (formData: FormData) => {
                            await addThisReply(formData);
                            setReplyingTo(null);
                          }}
                          spacing={0.75}
                        >
                          <TextField name="body" required autoFocus multiline minRows={2} placeholder="Write a reply…" slotProps={{ htmlInput: { "aria-label": "Reply" } }} />
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Button type="submit" variant="contained" size="small">
                              Reply
                            </Button>
                            <Button size="small" color="secondary" onClick={() => setReplyingTo(null)}>
                              Cancel
                            </Button>
                          </Box>
                        </Stack>
                      ) : (
                        <Box>
                          <Button size="small" onClick={() => setReplyingTo(c.id)} sx={{ px: 0.5, minWidth: 0, color: "text.muted", "&:hover": { color: "primary.main", bgcolor: "transparent" } }}>
                            Reply
                          </Button>
                        </Box>
                      )}
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>

            <Stack component="form" action={addCardComment.bind(null, card.id, null, paths)} spacing={1}>
              <TextField name="body" required multiline minRows={2} placeholder="Write a comment…" slotProps={{ htmlInput: { "aria-label": "Comment" } }} />
              <Box>
                <Button type="submit" variant="contained" size="small">
                  Comment
                </Button>
              </Box>
            </Stack>
          </Stack>

          {canDelete && (
            <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
              <form action={deleteThisCard}>
                <ConfirmButton
                  confirmText={`Delete "${card.title}"? This can't be undone.`}
                  ariaLabel={`Delete card "${card.title}"`}
                  icon={<DeleteOutlined />}
                  color="error"
                >
                  Delete this card
                </ConfirmButton>
              </form>
            </Box>
          )}
        </Stack>

        <Stack spacing={2.5} sx={{ borderLeft: { md: 1 }, borderColor: { md: "divider" }, pl: { md: 3 } }}>
          <Stack spacing={1}>
            <SectionLabel icon={PersonAddAltOutlined}>Assignees</SectionLabel>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
              {assignees.map((m) => (
                <MemberAvatar key={m.id} member={m} />
              ))}
              <Popover
                trigger={({ toggle }) => (
                  <IconButton
                    onClick={toggle}
                    aria-label="Add assignee"
                    sx={{ width: 28, height: 28, border: "1px dashed", borderColor: "divider", color: "text.muted", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}
                  >
                    <Add sx={{ fontSize: 15 }} />
                  </IconButton>
                )}
              >
                {(close) => (
                  <List dense sx={{ width: 208, p: 0.75 }}>
                    {members.length === 0 && (
                      <Typography sx={{ px: 1, py: 0.75, fontSize: 12, color: "text.muted" }}>No members yet.</Typography>
                    )}
                    {members.map((m) => {
                      const isAssigned = assigneeIds.includes(m.id);
                      const toggle = toggleCardAssignee.bind(null, card.id, m.id, isAssigned, paths);
                      return (
                        <form action={toggle} key={m.id} onSubmit={close}>
                          <ListItemButton component="button" type="submit" selected={isAssigned} sx={{ width: "100%", borderRadius: 2, gap: 1 }}>
                            <MemberAvatar member={m} size={20} />
                            <ListItemText primary={m.full_name ?? "Unnamed"} slotProps={{ primary: { noWrap: true, sx: { fontSize: 14 } } }} />
                            {isAssigned && <Check sx={{ fontSize: 16, color: "primary.main" }} />}
                          </ListItemButton>
                        </form>
                      );
                    })}
                  </List>
                )}
              </Popover>
            </Box>
          </Stack>

          <Stack spacing={1}>
            <SectionLabel icon={LabelOutlined}>Labels</SectionLabel>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
              {card.tags.map((tag) => {
                const color = colorFor(tag);
                const removeThis = removeCardTag.bind(null, card.id, tag, paths);
                return (
                  <Box
                    key={tag}
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      borderRadius: 999,
                      px: 1.25,
                      py: 0.5,
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      bgcolor: color.bg,
                      color: color.text,
                    }}
                  >
                    {tag}
                    <form action={removeThis} style={{ display: "inline-flex" }}>
                      <Box
                        component="button"
                        type="submit"
                        aria-label={`Remove label ${tag}`}
                        sx={{ display: "inline-flex", p: 0, border: 0, bgcolor: "transparent", color: "inherit", cursor: "pointer", opacity: 0.6, "&:hover": { opacity: 1 } }}
                      >
                        <Close sx={{ fontSize: 11 }} />
                      </Box>
                    </form>
                  </Box>
                );
              })}
              <Popover
                trigger={({ toggle }) => (
                  <Button
                    onClick={toggle}
                    size="small"
                    startIcon={<Add sx={{ fontSize: 12 }} />}
                    sx={{ minHeight: 0, py: 0.25, px: 1.25, fontSize: 10, border: "1px dashed", borderColor: "divider", color: "text.muted", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}
                  >
                    Add
                  </Button>
                )}
              >
                {(close) => (
                  <Box component="form" action={addThisTag} onSubmit={close} sx={{ display: "flex", width: 208, gap: 0.75, p: 1 }}>
                    <TextField name="tag" required placeholder="e.g. urgent" slotProps={{ htmlInput: { "aria-label": "Label" } }} />
                    <Button type="submit" variant="contained" size="small">
                      Add
                    </Button>
                  </Box>
                )}
              </Popover>
            </Box>
          </Stack>

          <Stack spacing={1}>
            <SectionLabel icon={CalendarMonthOutlined}>Due date</SectionLabel>
            <form action={setThisDueDate}>
              <TextField
                name="due_date"
                type="date"
                defaultValue={card.due_date ?? ""}
                onChange={(e) => (e.target as HTMLInputElement).form?.requestSubmit()}
                slotProps={{ htmlInput: { "aria-label": "Due date" } }}
              />
            </form>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

function UploadAttachmentForm({
  projectId,
  cardId,
  folders,
  paths,
}: {
  projectId: string;
  cardId: string;
  folders: Folder[];
  paths: string[];
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Popover
      trigger={({ toggle }) => (
        <Button onClick={toggle} variant="outlined" color="secondary" size="small" startIcon={<UploadFileOutlined />}>
          Upload a file
        </Button>
      )}
    >
      {(close) => (
        <Paper
          component="form"
          elevation={0}
          action={async (formData: FormData) => {
            setPending(true);
            setError(null);
            const result = await uploadAndAttachCardFile(projectId, cardId, paths, formData);
            setPending(false);
            if (result.success) close();
            else setError(result.message ?? "Upload failed.");
          }}
          sx={{ display: "flex", width: 256, flexDirection: "column", gap: 1.25, p: 1.5 }}
        >
          <FileInput name="file" label="File" required size="small" />
          {folders.length > 0 && (
            <SelectField name="folder_id" label="Folder" defaultValue="">
              <option value="">Top level</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </SelectField>
          )}
          <Button type="submit" variant="contained" size="small" disabled={pending}>
            {pending ? "Uploading…" : "Upload & attach"}
          </Button>
          {error && <Typography sx={{ fontSize: 11, color: "error.main" }}>{error}</Typography>}
        </Paper>
      )}
    </Popover>
  );
}
