import { Trash } from "@phosphor-icons/react/dist/ssr";
import { ConfirmButton } from "@/components/confirm-button";
import { logDecision, deleteDecision } from "@/lib/actions/decisions";

type Decision = {
  id: string;
  title: string;
  body: string | null;
  decided_at: string;
  decision_participants: { participant_name: string }[] | null;
};

export function DecisionsView({
  projectId,
  decisions,
  revalidatePaths,
  canLog,
  canDelete,
}: {
  projectId: string;
  decisions: Decision[];
  revalidatePaths: string[];
  canLog: boolean;
  canDelete: boolean;
}) {
  const logForThisProject = logDecision.bind(null, projectId, revalidatePaths);

  return (
    <div className="flex flex-col gap-6">
      {canLog && (
        <form
          action={logForThisProject}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="decision-title" className="text-sm font-medium text-secondary">
              Decision
            </label>
            <input
              id="decision-title"
              name="title"
              required
              placeholder="e.g. Crosslinker swap approved"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="decision-body" className="text-sm font-medium text-secondary">
              Details (optional)
            </label>
            <textarea
              id="decision-body"
              name="body"
              rows={2}
              placeholder="Any context worth keeping with the record"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex min-w-[160px] flex-1 flex-col gap-1.5">
              <label htmlFor="decision-date" className="text-sm font-medium text-secondary">
                Date
              </label>
              <input
                id="decision-date"
                name="decided_at"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
              />
            </div>
            <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
              <label htmlFor="decision-participants" className="text-sm font-medium text-secondary">
                Participants (optional)
              </label>
              <input
                id="decision-participants"
                name="participants"
                placeholder="Comma-separated names"
                className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary self-start rounded-full px-5 py-2.5 text-sm font-medium"
          >
            Log decision
          </button>
        </form>
      )}

      {!decisions.length ? (
        <p className="text-sm text-muted-foreground">No decisions logged yet.</p>
      ) : (
        <div className="divide-y divide-border border-t border-border">
          {decisions.map((d) => {
            const deleteThis = deleteDecision.bind(null, d.id, revalidatePaths);
            return (
              <div key={d.id} className="flex items-start justify-between gap-4 py-5">
                <div>
                  <p className="font-display text-base font-medium text-primary">{d.title}</p>
                  {d.body && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.body}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">
                      {new Date(d.decided_at).toLocaleDateString()}
                    </span>
                    {d.decision_participants?.map((p) => (
                      <span
                        key={p.participant_name}
                        className="rounded-full bg-muted px-2 py-0.5"
                      >
                        {p.participant_name}
                      </span>
                    ))}
                  </div>
                </div>
                {canDelete && (
                  <form action={deleteThis}>
                    <ConfirmButton
                      confirmText={`Delete the decision "${d.title}"? This can't be undone.`}
                      ariaLabel={`Delete decision "${d.title}"`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash size={15} />
                    </ConfirmButton>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
