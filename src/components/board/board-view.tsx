"use client";

import { useMemo, useState, type ReactNode } from "react";
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
import { Plus, ChatCircleDots, Paperclip } from "@phosphor-icons/react/dist/ssr";
import { createCard, reorderCards } from "@/lib/actions/board";
import { CardDetailModal, type ModalCard } from "./card-detail-modal";
import { colorFor, initials } from "./board-colors";

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
type CardComment = { id: string; card_id: string; author_id: string | null; body: string; created_at: string };
type CardLink = { id: string; card_id: string; url: string; label: string | null };
type CardFileLink = { card_id: string; file_id: string };
type ProjectFile = { id: string; filename: string; url: string | null; mime_type: string | null };

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

const DUE_STYLES: Record<string, string> = {
  overdue: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  soon: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  normal: "bg-muted text-muted-foreground",
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
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="font-display text-lg font-medium text-primary">No board yet</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This project doesn&apos;t have any board columns set up.
        </p>
      </div>
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
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
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
                      attachmentCount={
                        (fileIdsByCard.get(id)?.length ?? 0) + (linksByCard.get(id)?.length ?? 0)
                      }
                      onOpen={() => setOpenCardId(id)}
                    />
                  );
                })}
              </BoardColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="w-[252px]">
              <CardFace
                card={activeCard}
                assigneeIds={assigneesByCard.get(activeCard.id) ?? []}
                memberById={memberById}
                commentCount={commentsByCard.get(activeCard.id)?.length ?? 0}
                attachmentCount={
                  (fileIdsByCard.get(activeCard.id)?.length ?? 0) +
                  (linksByCard.get(activeCard.id)?.length ?? 0)
                }
                dragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardDetailModal
        card={modalCard}
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
    <div className="flex w-[280px] shrink-0 flex-col gap-3 rounded-2xl bg-muted/50 p-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-display text-sm font-medium text-primary">{column.name}</h3>
        <span className="rounded-full bg-card px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          {cardIds.length}
        </span>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex min-h-[8px] flex-col gap-2 rounded-xl transition-colors ${
            isOver ? "bg-accent/5" : ""
          }`}
        >
          {children}
        </div>
      </SortableContext>

      {adding ? (
        <form
          action={async (formData) => {
            await createAction(formData);
            setAdding(false);
          }}
          className="flex flex-col gap-2"
        >
          <textarea
            name="title"
            required
            autoFocus
            placeholder="Card title…"
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none transition-colors focus:border-accent"
          />
          <div className="flex items-center gap-2">
            <input
              name="due_date"
              type="date"
              className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-primary outline-none transition-colors focus:border-accent"
            />
            <button
              type="submit"
              className="btn-primary shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="shrink-0 rounded-full px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-card"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-card hover:text-primary"
        >
          <Plus size={14} weight="bold" />
          Add a card
        </button>
      )}
    </div>
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
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
    <div
      onClick={onClick}
      className={`flex cursor-pointer flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-md ${
        dragging ? "rotate-2 shadow-xl" : "shadow-sm"
      }`}
    >
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.tags.map((t) => {
            const color = colorFor(t);
            return (
              <span
                key={t}
                className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide ${color.bg} ${color.text}`}
              >
                {t}
              </span>
            );
          })}
        </div>
      )}

      <p className="text-sm font-medium leading-snug text-primary">{card.title}</p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {tone && (
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${DUE_STYLES[tone]}`}
            >
              {parseLocalDate(card.due_date!).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ChatCircleDots size={13} />
              {commentCount}
            </span>
          )}
          {attachmentCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Paperclip size={13} />
              {attachmentCount}
            </span>
          )}
        </div>
        {assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {assignees.slice(0, 3).map((m) => {
              const color = colorFor(m.id);
              return (
                <span
                  key={m.id}
                  title={m.full_name ?? "Unnamed"}
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-card font-mono text-[9px] font-medium ${color.bg} ${color.text}`}
                >
                  {initials(m.full_name)}
                </span>
              );
            })}
            {assignees.length > 3 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted font-mono text-[9px] font-medium text-muted-foreground">
                +{assignees.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
