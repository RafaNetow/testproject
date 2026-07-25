import { Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import { ConfirmButton } from "@/components/confirm-button";
import { AutoSubmitSelect } from "./auto-submit-select";
import { createCard, moveCard, deleteCard, updateCardAssignee } from "@/lib/actions/board";

type Column = { id: string; name: string; position: number };
type Card = {
  id: string;
  column_id: string;
  title: string;
  tags: string[] | null;
  due_date: string | null;
  position: number;
  assignee_id: string | null;
};
type Member = { id: string; full_name: string | null };

function initials(name: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

export function BoardView({
  projectId,
  columns,
  cards,
  members,
  revalidatePaths,
  canDelete,
}: {
  projectId: string;
  columns: Column[];
  cards: Card[];
  members: Member[];
  revalidatePaths: string[];
  canDelete: boolean;
}) {
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

  const columnOptions = columns.map((c) => ({ value: c.id, label: c.name }));
  const assigneeOptions = [
    { value: "", label: "Unassigned" },
    ...members.map((m) => ({ value: m.id, label: m.full_name ?? "Unnamed" })),
  ];
  const memberById = new Map(members.map((m) => [m.id, m]));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => {
        const cardsInColumn = cards
          .filter((c) => c.column_id === col.id)
          .sort((a, b) => a.position - b.position);
        const createInThisColumn = createCard.bind(null, projectId, col.id, revalidatePaths);

        return (
          <div
            key={col.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-medium text-primary">{col.name}</h3>
              <span className="font-mono text-xs text-muted-foreground">
                {cardsInColumn.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {cardsInColumn.map((card) => {
                const moveThisCard = moveCard.bind(null, card.id, revalidatePaths);
                const deleteThisCard = deleteCard.bind(null, card.id, revalidatePaths);
                const assignThisCard = updateCardAssignee.bind(null, card.id, revalidatePaths);
                const assignee = card.assignee_id ? memberById.get(card.assignee_id) : undefined;
                return (
                  <div
                    key={card.id}
                    className="rounded-lg border border-border bg-background p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-primary">{card.title}</p>
                      <span
                        title={assignee?.full_name ?? "Unassigned"}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-medium ${
                          assignee
                            ? "bg-accent/10 text-accent"
                            : "border border-dashed border-border text-muted-foreground"
                        }`}
                      >
                        {initials(assignee?.full_name ?? null)}
                      </span>
                    </div>
                    {(card.tags?.length || card.due_date) && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {card.tags?.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                        {card.due_date && (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Due {card.due_date}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-2 flex flex-col gap-1.5">
                      <form action={moveThisCard}>
                        <AutoSubmitSelect
                          name="column_id"
                          defaultValue={col.id}
                          options={columnOptions}
                          className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-primary outline-none transition-colors focus:border-accent"
                        />
                      </form>
                      <div className="flex items-center gap-1.5">
                        {members.length > 0 && (
                          <form action={assignThisCard} className="flex-1">
                            <AutoSubmitSelect
                              name="assignee_id"
                              defaultValue={card.assignee_id ?? ""}
                              options={assigneeOptions}
                              className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-primary outline-none transition-colors focus:border-accent"
                            />
                          </form>
                        )}
                        {canDelete && (
                          <form action={deleteThisCard}>
                            <ConfirmButton
                              confirmText={`Delete "${card.title}"?`}
                              ariaLabel={`Delete card "${card.title}"`}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash size={13} />
                            </ConfirmButton>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              action={createInThisColumn}
              className="flex flex-col gap-2 border-t border-border pt-3"
            >
              <input
                name="title"
                required
                placeholder="New card…"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none transition-colors focus:border-accent"
              />
              <div className="flex gap-2">
                <input
                  name="due_date"
                  type="date"
                  className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-primary outline-none transition-colors focus:border-accent"
                />
                <button
                  type="submit"
                  className="btn-primary flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium"
                >
                  <Plus size={13} weight="bold" />
                  Add
                </button>
              </div>
            </form>
          </div>
        );
      })}
    </div>
  );
}
