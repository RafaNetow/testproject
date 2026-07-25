import { Trash } from "@phosphor-icons/react/dist/ssr";
import { ConfirmButton } from "@/components/confirm-button";
import { publishUpdate, deleteUpdate } from "@/lib/actions/updates";

type Update = {
  id: string;
  title: string;
  body: string;
  published_at: string;
};

export function UpdatesView({
  projectId,
  updates,
  revalidatePaths,
  canPublish,
  canDelete,
}: {
  projectId: string;
  updates: Update[];
  revalidatePaths: string[];
  canPublish: boolean;
  canDelete: boolean;
}) {
  const publishForThisProject = publishUpdate.bind(null, projectId, revalidatePaths);

  return (
    <div className="flex flex-col gap-6">
      {canPublish && (
        <form
          action={publishForThisProject}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="update-title" className="text-sm font-medium text-secondary">
              Title
            </label>
            <input
              id="update-title"
              name="title"
              required
              placeholder="e.g. Week 6: batch trial results"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="update-body" className="text-sm font-medium text-secondary">
              Update
            </label>
            <textarea
              id="update-body"
              name="body"
              required
              rows={3}
              placeholder="What happened, what it means, what's next"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="btn-primary self-start rounded-full px-5 py-2.5 text-sm font-medium"
          >
            Publish update
          </button>
        </form>
      )}

      {!updates.length ? (
        <p className="text-sm text-muted-foreground">No updates published yet.</p>
      ) : (
        <div className="divide-y divide-border border-t border-border">
          {updates.map((u) => {
            const deleteThis = deleteUpdate.bind(null, u.id, revalidatePaths);
            return (
              <div key={u.id} className="flex items-start justify-between gap-4 py-5">
                <div>
                  <p className="font-display text-base font-medium text-primary">{u.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-secondary">{u.body}</p>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    {new Date(u.published_at).toLocaleDateString("en-GB", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                {canDelete && (
                  <form action={deleteThis}>
                    <ConfirmButton
                      confirmText={`Delete the update "${u.title}"?`}
                      ariaLabel={`Delete update "${u.title}"`}
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
