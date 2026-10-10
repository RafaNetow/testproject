"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Add from "@mui/icons-material/Add";
import AttachFile from "@mui/icons-material/AttachFile";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import Close from "@mui/icons-material/Close";
import ChatBubbleOutlined from "@mui/icons-material/ChatBubbleOutlined";
import { createCard, reorderCards } from "@/lib/actions/board";
import { CardDetailModal, type ModalCard } from "./card-detail-modal";
import { colorFor, initials } from "./board-colors";
import { EmptyState } from "@/components/shared/empty-state";

type Column = { id: string; name: string; position: number };
type Card = {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  due_date: string | null;
  position: number;
};
type Member = { id: string; full_name: string | null };
type Assignee = { card_id: string; profile_id: string };
type CardComment = {
  id: string;
  card_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
  parent_comment_id: string | null;
};
type CardLink = { id: string; card_id: string; url: string; label: string | null };
type CardFileLink = { card_id: string; file_id: string };
type ProjectFile = {
  id: string;
  filename: string;
  folder_id: string | null;
  url: string | null;
  mime_type: string | null;
};
type Folder = { id: string; name: string };

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dueDateTone(dueDate: string | null): "overdue" | "soon" | "normal" | null {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((parseLocalDate(dueDate).getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "soon";
  return "normal";
}

const DUE_COLORS: Record<string, { bg: string; color: string }> = {
  overdue: { bg: "light-dark(#fee2e2, rgb(239 68 68 / 0.15))", color: "light-dark(#b91c1c, #f87171)" },
  soon: { bg: "light-dark(#fef3c7, rgb(245 158 11 / 0.15))", color: "light-dark(#b45309, #fbbf24)" },
  normal: { bg: "rgb(145 158 171 / 0.16)", color: "var(--color-secondary)" },
};

function groupByColumn(columns: Column[], cards: Card[]) {
  const map: Record<string, string[]> = {};
  for (const col of columns) {
    map[col.id] = cards
      .filter((c) => c.column_id === col.id)
      .sort((a, b) => a.position - b.position)
      .map((c) => c.id);
  }
  return map;
}

export function BoardView({
  projectId,
  filesBaseUrl,
  folders,
  columns,
  cards,
  members,
  assignees,
  comments,
  links,
  cardFiles,
  projectFiles,
  currentUserId,
  revalidatePaths,
  canDelete,
}: {
  projectId: string;
  filesBaseUrl: string;
  folders: Folder[];
  columns: Column[];
  cards: Card[];
  members: Member[];
  assignees: Assignee[];
  comments: CardComment[];
  links: CardLink[];
  cardFiles: CardFileLink[];
  projectFiles: ProjectFile[];
  currentUserId: string;
  revalidatePaths: string[];
  canDelete: boolean;
}) {
  const [columnCardIds, setColumnCardIds] = useState<Record<string, string[]>>(() =>
    groupByColumn(columns, cards)
  );
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  // Stretch the board down to the bottom of the window, so columns read as
  // full-height lanes (and scroll their own cards) instead of stopping short.
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const fit = () => {
      const top = strip.getBoundingClientRect().top + window.scrollY;
      strip.style.height = `${Math.max(420, window.innerHeight - top - 24)}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Resyncs local drag state with the server's data after every revalidation
  // (new card, moved-elsewhere update, etc.) — without this, anything that
  // isn't purely reflected in an existing card's own fields (i.e. a brand
  // new card) would only show up after a manual page reload.
  // Adjusted during render (not in an effect) so the board never paints a stale frame.
  const [syncedFrom, setSyncedFrom] = useState({ columns, cards });
  if (syncedFrom.columns !== columns || syncedFrom.cards !== cards) {
    setSyncedFrom({ columns, cards });
    setColumnCardIds(groupByColumn(columns, cards));
  }

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const assigneesByCard = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const a of assignees) map.set(a.card_id, [...(map.get(a.card_id) ?? []), a.profile_id]);
    return map;
  }, [assignees]);
  const commentsByCard = useMemo(() => {
    const map = new Map<string, CardComment[]>();
    for (const c of comments) map.set(c.card_id, [...(map.get(c.card_id) ?? []), c]);
    return map;
  }, [comments]);
  const linksByCard = useMemo(() => {
    const map = new Map<string, CardLink[]>();
    for (const l of links) map.set(l.card_id, [...(map.get(l.card_id) ?? []), l]);
    return map;
  }, [links]);
  const fileIdsByCard = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const cf of cardFiles) map.set(cf.card_id, [...(map.get(cf.card_id) ?? []), cf.file_id]);
    return map;
  }, [cardFiles]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function findColumnOf(id: string): string | undefined {
    if (columnCardIds[id]) return id;
    return Object.keys(columnCardIds).find((colId) => columnCardIds[colId].includes(id));
  }

  function onDragStart(event: DragStartEvent) {
    setActiveCardId(String(event.active.id));
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const fromCol = findColumnOf(activeId);
    const toCol = findColumnOf(overId);
    if (!fromCol || !toCol || fromCol === toCol) return;

    setColumnCardIds((prev) => {
      const fromIds = prev[fromCol].filter((id) => id !== activeId);
      const overIndex = prev[toCol].indexOf(overId);
      const toIds = [...prev[toCol]];
      toIds.splice(overIndex >= 0 ? overIndex : toIds.length, 0, activeId);
      return { ...prev, [fromCol]: fromIds, [toCol]: toIds };
    });
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveCardId(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const col = findColumnOf(activeId);
    if (!col) return;

    let finalIds = columnCardIds[col];
    const oldIndex = finalIds.indexOf(activeId);
    const overIndexInCol = finalIds.indexOf(overId);
    if (overIndexInCol >= 0 && overIndexInCol !== oldIndex) {
      finalIds = arrayMove(finalIds, oldIndex, overIndexInCol);
      setColumnCardIds((prev) => ({ ...prev, [col]: finalIds }));
    }

    void reorderCards(revalidatePaths, col, finalIds);
  }


  if (!columns.length) {
    return (
      <EmptyState title="No board yet">
        This project doesn&apos;t have any board columns set up.
      </EmptyState>
    );
  }

  const openCard = openCardId ? cardById.get(openCardId) : undefined;
  const openColumn = openCard ? columns.find((c) => c.id === openCard.column_id) : undefined;
  const modalCard: ModalCard | null = openCard
    ? {
        id: openCard.id,
        title: openCard.title,
        description: openCard.description,
        tags: openCard.tags ?? [],
        due_date: openCard.due_date,
        column_id: openCard.column_id,
      }
    : null;
  const activeCard = activeCardId ? cardById.get(activeCardId) : undefined;

  return (
    <>
      <DndContext
        id={`board-${projectId}`}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <Box
          ref={stripRef}
          data-full-bleed
          sx={{
            display: "flex",
            alignItems: "stretch",
            gap: 2,
            overflowX: "auto",
            pb: 1.5,
            scrollbarWidth: "thin",
            scrollbarColor: "rgb(145 158 171 / 0.4) transparent",
          }}
        >
          {columns.map((col) => {
            const ids = columnCardIds[col.id] ?? [];
            const createInThisColumn = createCard.bind(null, projectId, col.id, revalidatePaths);
            return (
              <BoardColumn key={col.id} column={col} cardIds={ids} createAction={createInThisColumn}>
                {ids.map((id) => {
                  const card = cardById.get(id);
                  if (!card) return null;
                  return (
                    <SortableCard
                      key={id}
                      card={card}
                      assigneeIds={assigneesByCard.get(id) ?? []}
                      memberById={memberById}
                      commentCount={commentsByCard.get(id)?.length ?? 0}
                      attachmentCount={(fileIdsByCard.get(id)?.length ?? 0) + (linksByCard.get(id)?.length ?? 0)}
                      onOpen={() => setOpenCardId(id)}
                    />
                  );
                })}
              </BoardColumn>
            );
          })}
        </Box>

        <DragOverlay>
          {activeCard ? (
            <Box sx={{ width: 304 }}>
              <CardFace
                card={activeCard}
                assigneeIds={assigneesByCard.get(activeCard.id) ?? []}
                memberById={memberById}
                commentCount={commentsByCard.get(activeCard.id)?.length ?? 0}
                attachmentCount={
                  (fileIdsByCard.get(activeCard.id)?.length ?? 0) + (linksByCard.get(activeCard.id)?.length ?? 0)
                }
                dragging
              />
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardDetailModal
        card={modalCard}
        projectId={projectId}
        filesBaseUrl={filesBaseUrl}
        folders={folders}
        columnName={openColumn?.name ?? ""}
        members={members}
        assigneeIds={openCardId ? (assigneesByCard.get(openCardId) ?? []) : []}
        comments={openCardId ? (commentsByCard.get(openCardId) ?? []) : []}
        links={openCardId ? (linksByCard.get(openCardId) ?? []) : []}
        attachedFileIds={openCardId ? (fileIdsByCard.get(openCardId) ?? []) : []}
        projectFiles={projectFiles}
        currentUserId={currentUserId}
        canDelete={canDelete}
        paths={revalidatePaths}
        onClose={() => setOpenCardId(null)}
      />
    </>
  );
}

function BoardColumn({
  column,
  cardIds,
  createAction,
  children,
}: {
  column: Column;
  cardIds: string[];
  createAction: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [adding, setAdding] = useState(false);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        // Lanes share the full width; below 256px each, the board scrolls sideways.
        flex: "1 0 256px",
        minWidth: 256,
        minHeight: 0,
        borderRadius: 2,
        bgcolor: "var(--color-muted)",
        p: 2,
        transition: "background-color 150ms",
        ...(isOver && { bgcolor: "color-mix(in srgb, var(--color-accent) 8%, var(--color-muted))" }),
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Box
          component="span"
          sx={{
            display: "inline-grid",
            placeItems: "center",
            minWidth: 24,
            height: 24,
            px: 0.75,
            borderRadius: "50%",
            bgcolor: "rgb(145 158 171 / 0.16)",
            color: "text.secondary",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {cardIds.length}
        </Box>
        <Typography variant="h3" noWrap sx={{ flex: 1, fontSize: 16 }}>
          {column.name}
        </Typography>
        <Tooltip title="Add task">
          <IconButton size="small" aria-label={`Add a card to ${column.name}`} onClick={() => setAdding(true)}>
            <Add sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {adding && (
        <Box
          component="form"
          action={async (formData: FormData) => {
            await createAction(formData);
            setAdding(false);
          }}
          sx={{ mb: 2, p: 2, borderRadius: 1.5, bgcolor: "background.paper", boxShadow: CARD_SHADOW }}
        >
          <InputBase
            name="title"
            required
            autoFocus
            multiline
            fullWidth
            placeholder="Untitled"
            inputProps={{ "aria-label": "Card title" }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setAdding(false);
            }}
            sx={{ fontSize: 14, fontWeight: 600 }}
          />
          <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              name="due_date"
              type="date"
              slotProps={{ htmlInput: { "aria-label": "Due date" } }}
              sx={{ flex: 1, "& input": { fontSize: 13 } }}
            />
            <Button type="submit" variant="contained" size="small">
              Add
            </Button>
            <IconButton size="small" aria-label="Cancel" onClick={() => setAdding(false)}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      )}

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <Stack
          spacing={2}
          sx={{
            flex: "0 1 auto",
            minHeight: 48,
            overflowY: "auto",
            // Room for card shadows inside the scroll area.
            mx: -0.5,
            px: 0.5,
            py: 0.25,
            scrollbarWidth: "thin",
            scrollbarColor: "rgb(145 158 171 / 0.4) transparent",
          }}
        >
          {children}
        </Stack>
      </SortableContext>

      {!adding && (
        <Button
          onClick={() => setAdding(true)}
          startIcon={<Add />}
          color="inherit"
          sx={{ mt: 1.5, flexShrink: 0, justifyContent: "flex-start", color: "text.secondary", "&:hover": { bgcolor: "rgb(145 158 171 / 0.12)" } }}
        >
          Add task
        </Button>
      )}
    </Box>
  );
}

function SortableCard({
  card,
  assigneeIds,
  memberById,
  commentCount,
  attachmentCount,
  onOpen,
}: {
  card: Card;
  assigneeIds: string[];
  memberById: Map<string, Member>;
  commentCount: number;
  attachmentCount: number;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.24 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardFace
        card={card}
        assigneeIds={assigneeIds}
        memberById={memberById}
        commentCount={commentCount}
        attachmentCount={attachmentCount}
        onClick={onOpen}
      />
    </div>
  );
}

/** Minimal's kanban card shadow — lighter than the dashboard card shadow. */
const CARD_SHADOW = "0 1px 2px 0 rgb(145 158 171 / 0.16)";

const metaSx = { display: "flex", alignItems: "center", gap: 0.25, fontSize: 12, color: "text.muted" } as const;

function CardFace({
  card,
  assigneeIds,
  memberById,
  commentCount,
  attachmentCount,
  onClick,
  dragging,
}: {
  card: Card;
  assigneeIds: string[];
  memberById: Map<string, Member>;
  commentCount: number;
  attachmentCount: number;
  onClick?: () => void;
  dragging?: boolean;
}) {
  const tone = dueDateTone(card.due_date);
  const assignees = assigneeIds.map((id) => memberById.get(id)).filter(Boolean) as Member[];

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        borderRadius: 1.5,
        bgcolor: "background.paper",
        p: 2.5,
        cursor: "pointer",
        boxShadow: dragging ? "var(--shadow-dropdown)" : CARD_SHADOW,
        transform: dragging ? "rotate(3deg)" : undefined,
        transition: "box-shadow 200ms",
        "&:hover": { boxShadow: "var(--shadow-card)" },
      }}
    >
      {card.tags && card.tags.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {card.tags.map((t) => {
            const color = colorFor(t);
            return (
              <Box
                key={t}
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 22,
                  borderRadius: 0.75,
                  px: 0.75,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: color.bg,
                  color: color.text,
                }}
              >
                {t}
              </Box>
            );
          })}
        </Box>
      )}

      <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{card.title}</Typography>

      {(tone || commentCount > 0 || attachmentCount > 0 || assignees.length > 0) && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            {tone && (
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  height: 22,
                  borderRadius: 0.75,
                  px: 0.75,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: DUE_COLORS[tone].bg,
                  color: DUE_COLORS[tone].color,
                }}
              >
                <CalendarMonthOutlined sx={{ fontSize: 13 }} />
                {parseLocalDate(card.due_date!).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </Box>
            )}
            {commentCount > 0 && (
              <Box component="span" sx={metaSx}>
                <ChatBubbleOutlined sx={{ fontSize: 15 }} />
                {commentCount}
              </Box>
            )}
            {attachmentCount > 0 && (
              <Box component="span" sx={metaSx}>
                <AttachFile sx={{ fontSize: 15 }} />
                {attachmentCount}
              </Box>
            )}
          </Box>
          {assignees.length > 0 && (
            <AvatarGroup
              max={3}
              sx={{ "& .MuiAvatar-root": { width: 24, height: 24, fontSize: 10, fontWeight: 700, borderWidth: 2 } }}
            >
              {assignees.map((m) => {
                const color = colorFor(m.id);
                return (
                  <Avatar key={m.id} title={m.full_name ?? "Unnamed"} sx={{ bgcolor: color.bg, color: color.text }}>
                    {initials(m.full_name)}
                  </Avatar>
                );
              })}
            </AvatarGroup>
          )}
        </Box>
      )}
    </Box>
  );
}
