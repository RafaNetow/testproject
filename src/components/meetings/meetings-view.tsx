import { Plus, Trash, VideoCamera } from "@phosphor-icons/react/dist/ssr";
import { ConfirmButton } from "@/components/confirm-button";
import { createMeeting, updateMeeting, deleteMeeting } from "@/lib/actions/meetings";

type Meeting = {
  id: string;
  title: string;
  zoom_url: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  notes: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-accent/10 text-accent",
  past: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export function MeetingsView({
  projectId,
  meetings,
  revalidatePaths,
  canManage,
}: {
  projectId: string;
  meetings: Meeting[];
  revalidatePaths: string[];
  canManage: boolean;
}) {
  const createForThisProject = createMeeting.bind(null, projectId, revalidatePaths);

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <form
          action={createForThisProject}
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <label htmlFor="meeting-title" className="text-sm font-medium text-secondary">
              Title
            </label>
            <input
              id="meeting-title"
              name="title"
              required
              placeholder="Monthly review"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="meeting-when" className="text-sm font-medium text-secondary">
              Date &amp; time
            </label>
            <input
              id="meeting-when"
              name="scheduled_at"
              type="datetime-local"
              required
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex w-28 flex-col gap-1.5">
            <label htmlFor="meeting-duration" className="text-sm font-medium text-secondary">
              Minutes
            </label>
            <input
              id="meeting-duration"
              name="duration_minutes"
              type="number"
              min={0}
              placeholder="30"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <label htmlFor="meeting-zoom" className="text-sm font-medium text-secondary">
              Video link (optional)
            </label>
            <input
              id="meeting-zoom"
              name="zoom_url"
              type="url"
              placeholder="https://…"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
          >
            <Plus size={16} weight="bold" />
            Schedule
          </button>
        </form>
      )}

      {!meetings.length ? (
        <p className="text-sm text-muted-foreground">No meetings scheduled yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {meetings.map((m) => {
            const updateThis = updateMeeting.bind(null, m.id, revalidatePaths);
            const deleteThis = deleteMeeting.bind(null, m.id, revalidatePaths);
            const when = new Date(m.scheduled_at);
            return (
              <div key={m.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-base font-medium text-primary">
                        {m.title}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[m.status] ?? STATUS_STYLES.upcoming
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {when.toLocaleDateString("en-GB", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      at{" "}
                      {when.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {m.duration_minutes ? ` · ${m.duration_minutes} min` : ""}
                    </p>
                    {m.notes && (
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary">
                        {m.notes}
                      </p>
                    )}
                  </div>
                  {m.zoom_url && (
                    <a
                      href={m.zoom_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted"
                    >
                      <VideoCamera size={16} />
                      Join
                    </a>
                  )}
                </div>

                {canManage && (
                  <details className="mt-3 border-t border-border pt-3">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                      Manage
                    </summary>
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <form action={updateThis} className="flex flex-1 flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-secondary">Status</label>
                          <select
                            name="status"
                            defaultValue={m.status}
                            className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="past">Past</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
                          <label className="text-sm font-medium text-secondary">Notes</label>
                          <input
                            name="notes"
                            defaultValue={m.notes ?? ""}
                            placeholder="What was covered / decided"
                            className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
                          />
                        </div>
                        <button
                          type="submit"
                          className="rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                          Save
                        </button>
                      </form>
                      <form action={deleteThis}>
                        <ConfirmButton
                          confirmText={`Delete the meeting "${m.title}"?`}
                          ariaLabel={`Delete meeting "${m.title}"`}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash size={15} />
                        </ConfirmButton>
                      </form>
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
