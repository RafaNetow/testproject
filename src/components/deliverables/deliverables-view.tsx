import { FileText, Paperclip, Trash, X } from "@phosphor-icons/react/dist/ssr";
import { ConfirmButton } from "@/components/confirm-button";
import { SelectField } from "@/components/shared/select-field";
import { StatusBadge } from "@/components/shared/status-badge";
import { ReviewControls } from "@/components/deliverables/review-controls";
import {
  ADMIN_STATUS_LABEL,
  CLIENT_STATUS_LABEL,
  DELIVERABLE_STATUSES,
  formatDateOnly,
  groupForClient,
  isOverdue,
  type DeliverableStatus,
} from "@/lib/deliverables";
import {
  attachDeliverableFile,
  createDeliverable,
  deleteDeliverable,
  detachDeliverableFile,
  updateDeliverable,
} from "@/lib/actions/deliverables";

export type DeliverableFile = {
  id: string;
  filename: string;
  size_bytes: number;
  url: string | null;
};

export type DeliverableRow = {
  id: string;
  title: string;
  description: string | null;
  status: DeliverableStatus;
  due_date: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  files: DeliverableFile[];
};

export type ProjectFileOption = { id: string; filename: string };

const inputClass =
  "rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileList({
  files,
  onDetach,
}: {
  files: DeliverableFile[];
  onDetach?: (fileId: string) => (() => Promise<void>) | undefined;
}) {
  if (!files.length) return null;
  return (
    <ul className="mt-4 flex flex-col gap-1.5">
      {files.map((f) => {
        const detach = onDetach?.(f.id);
        return (
          <li key={f.id} className="flex items-center gap-2 text-sm">
            <FileText size={16} className="shrink-0 text-muted-foreground" />
            {f.url ? (
              <a
                href={f.url}
                download={f.filename}
                className="min-w-0 truncate font-medium text-accent underline-offset-2 hover:underline"
              >
                {f.filename}
              </a>
            ) : (
              <span className="min-w-0 truncate text-muted-foreground">{f.filename} (unavailable)</span>
            )}
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {formatSize(f.size_bytes)}
            </span>
            {detach && (
              <form action={detach}>
                <button
                  type="submit"
                  aria-label={`Remove ${f.filename} from this deliverable`}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X size={12} />
                </button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function DueDate({ d, today }: { d: DeliverableRow; today?: string }) {
  if (!d.due_date) return null;
  const overdue = isOverdue(d.due_date, d.status, today);
  return (
    <span className={`font-mono text-xs ${overdue ? "font-medium text-destructive" : "text-muted-foreground"}`}>
      {overdue ? "Overdue · " : "Due "}
      {formatDateOnly(d.due_date)}
    </span>
  );
}

function ReviewOutcome({ d, audience }: { d: DeliverableRow; audience: "admin" | "client" }) {
  if (d.status === "approved" && d.reviewed_at) {
    return (
      <p className="mt-4 text-sm text-secondary">
        Approved on {formatDateOnly(d.reviewed_at)}.
      </p>
    );
  }
  if (d.status === "changes_requested" && d.review_note) {
    return (
      <div className="mt-4 rounded-lg bg-muted px-4 py-3">
        <p className="text-sm font-medium text-primary">
          {audience === "client" ? "Changes you requested" : "Changes the client requested"}
        </p>
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-secondary">{d.review_note}</p>
      </div>
    );
  }
  return null;
}

export function DeliverablesView({
  mode,
  projectId,
  deliverables,
  projectFiles = [],
  canReview = false,
  today,
}: {
  mode: "admin" | "client";
  projectId: string;
  deliverables: DeliverableRow[];
  projectFiles?: ProjectFileOption[];
  canReview?: boolean;
  today?: string;
}) {
  return mode === "admin" ? (
    <AdminDeliverables
      projectId={projectId}
      deliverables={deliverables}
      projectFiles={projectFiles}
      today={today}
    />
  ) : (
    <ClientDeliverables deliverables={deliverables} canReview={canReview} today={today} />
  );
}

/* ------------------------------ client ------------------------------ */

function ClientDeliverables({
  deliverables,
  canReview,
  today,
}: {
  deliverables: DeliverableRow[];
  canReview: boolean;
  today?: string;
}) {
  if (!deliverables.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="font-display text-lg font-medium text-primary">No deliverables yet</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Reports and recommendations will appear here as soon as they&apos;re ready for you.
        </p>
      </div>
    );
  }

  const groups = groupForClient(deliverables);
  const sections: { key: string; title: string; items: DeliverableRow[] }[] = [
    { key: "review", title: "Awaiting your review", items: groups.awaitingReview },
    { key: "changes", title: "Changes requested", items: groups.changesRequested },
    { key: "progress", title: "In progress", items: groups.inProgress },
    { key: "approved", title: "Approved", items: groups.approved },
  ];

  return (
    <div className="flex flex-col gap-10">
      {sections
        .filter((s) => s.items.length)
        .map((s) => (
          <section key={s.key} aria-labelledby={`deliverables-${s.key}`} className="flex flex-col gap-4">
            <h2 id={`deliverables-${s.key}`} className="font-display text-lg font-medium text-primary">
              {s.title}
              <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">
                {s.items.length}
              </span>
            </h2>
            {s.items.map((d) => (
              <article key={d.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <h3 className="font-display text-base font-medium text-primary">{d.title}</h3>
                  <StatusBadge status={d.status} label={CLIENT_STATUS_LABEL[d.status]} />
                  <DueDate d={d} today={today} />
                </div>
                {d.description && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {d.description}
                  </p>
                )}
                <FileList files={d.files} />
                <ReviewOutcome d={d} audience="client" />
                {d.status === "in_review" &&
                  (canReview ? (
                    <ReviewControls deliverableId={d.id} title={d.title} />
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Only your workspace owner can approve this or request changes.
                    </p>
                  ))}
              </article>
            ))}
          </section>
        ))}
    </div>
  );
}

/* ------------------------------- admin ------------------------------ */

function AdminDeliverables({
  projectId,
  deliverables,
  projectFiles,
  today,
}: {
  projectId: string;
  deliverables: DeliverableRow[];
  projectFiles: ProjectFileOption[];
  today?: string;
}) {
  const create = createDeliverable.bind(null, projectId);

  return (
    <div className="flex flex-col gap-8">
      <form action={create} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="deliverable-title" className="text-sm font-medium text-secondary">
            Title
          </label>
          <input
            id="deliverable-title"
            name="title"
            required
            maxLength={200}
            placeholder="e.g. Root-cause report: bond failures"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="deliverable-description" className="text-sm font-medium text-secondary">
            Description (optional)
          </label>
          <textarea
            id="deliverable-description"
            name="description"
            rows={2}
            maxLength={5000}
            placeholder="What the client is getting and what you need from them"
            className={inputClass}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-[160px] flex-1 flex-col gap-1.5">
            <label htmlFor="deliverable-due" className="text-sm font-medium text-secondary">
              Due date (optional)
            </label>
            <input id="deliverable-due" name="due_date" type="date" className={inputClass} />
          </div>
          <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <label htmlFor="deliverable-status" className="text-sm font-medium text-secondary">
              Status
            </label>
            <SelectField id="deliverable-status" name="status" defaultValue="draft">
              {DELIVERABLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ADMIN_STATUS_LABEL[s]}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Drafts are hidden from the client. Setting a deliverable to &ldquo;Awaiting client&rdquo; shows
          it to them and notifies their team.
        </p>
        <button type="submit" className="btn-primary self-start rounded-full px-5 py-2.5 text-sm font-medium">
          Add deliverable
        </button>
      </form>

      {!deliverables.length ? (
        <p className="text-sm text-muted-foreground">No deliverables yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {deliverables.map((d) => {
            const update = updateDeliverable.bind(null, d.id);
            const attach = attachDeliverableFile.bind(null, d.id);
            const remove = deleteDeliverable.bind(null, d.id);
            const attachedIds = new Set(d.files.map((f) => f.id));
            const attachable = projectFiles.filter((f) => !attachedIds.has(f.id));

            return (
              <article key={d.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <h3 className="font-display text-base font-medium text-primary">{d.title}</h3>
                  <StatusBadge status={d.status} label={ADMIN_STATUS_LABEL[d.status]} />
                  <DueDate d={d} today={today} />
                </div>
                {d.description && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {d.description}
                  </p>
                )}
                <FileList files={d.files} onDetach={(fileId) => detachDeliverableFile.bind(null, d.id, fileId)} />
                <ReviewOutcome d={d} audience="admin" />

                <details className="group mt-4 border-t border-border pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-accent">
                    Edit &ldquo;{d.title}&rdquo;
                  </summary>
                  <div className="mt-4 flex flex-col gap-6">
                    <form action={update} className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor={`title-${d.id}`} className="text-sm font-medium text-secondary">
                          Title
                        </label>
                        <input
                          id={`title-${d.id}`}
                          name="title"
                          required
                          maxLength={200}
                          defaultValue={d.title}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor={`desc-${d.id}`} className="text-sm font-medium text-secondary">
                          Description
                        </label>
                        <textarea
                          id={`desc-${d.id}`}
                          name="description"
                          rows={3}
                          maxLength={5000}
                          defaultValue={d.description ?? ""}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex min-w-[160px] flex-1 flex-col gap-1.5">
                          <label htmlFor={`due-${d.id}`} className="text-sm font-medium text-secondary">
                            Due date
                          </label>
                          <input
                            id={`due-${d.id}`}
                            name="due_date"
                            type="date"
                            defaultValue={d.due_date ?? ""}
                            className={inputClass}
                          />
                        </div>
                        <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
                          <label htmlFor={`status-${d.id}`} className="text-sm font-medium text-secondary">
                            Status
                          </label>
                          <SelectField id={`status-${d.id}`} name="status" defaultValue={d.status}>
                            {DELIVERABLE_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {ADMIN_STATUS_LABEL[s]}
                              </option>
                            ))}
                          </SelectField>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="btn-primary self-start rounded-full px-5 py-2.5 text-sm font-medium"
                      >
                        Save changes
                      </button>
                    </form>

                    <form action={attach} className="flex flex-wrap items-end gap-3">
                      <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
                        <label htmlFor={`attach-${d.id}`} className="text-sm font-medium text-secondary">
                          Attach a project file
                        </label>
                        <SelectField id={`attach-${d.id}`} name="file_id" defaultValue="" disabled={!attachable.length}>
                          <option value="">
                            {attachable.length ? "Choose a file…" : "No more files in this project"}
                          </option>
                          {attachable.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.filename}
                            </option>
                          ))}
                        </SelectField>
                      </div>
                      <button
                        type="submit"
                        disabled={!attachable.length}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-muted disabled:opacity-50"
                      >
                        <Paperclip size={15} />
                        Attach
                      </button>
                    </form>

                    <form action={remove}>
                      <ConfirmButton
                        confirmText={`Delete the deliverable "${d.title}"? This can't be undone.`}
                        ariaLabel={`Delete deliverable "${d.title}"`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash size={15} />
                        Delete this deliverable
                      </ConfirmButton>
                    </form>
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
