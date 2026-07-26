import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChatCircleDots,
  Clock,
  FileText,
  FolderOpen,
  NotePencil,
  Plus,
  Receipt,
  SquaresFour,
  Trash,
  VideoCamera,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { ConfirmButton } from "@/components/confirm-button";
import { InviteForm } from "./invite-form";
import {
  removeMember,
  updateOrganization,
  deleteOrganization,
  createProject,
  updateProject,
  deleteProject,
} from "./actions";

const STATUS_OPTIONS = ["onboarding", "active", "at_risk", "offboarded"] as const;
const PROJECT_STATUS_OPTIONS = ["active", "paused", "completed"] as const;

const STATUS_STYLES: Record<string, string> = {
  onboarding: "bg-accent/10 text-accent",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  at_risk: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  offboarded: "bg-muted text-muted-foreground",
};

const PROJECT_STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  completed: "bg-muted text-muted-foreground",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, status, cvr_number, billing_address")
    .eq("id", orgId)
    .maybeSingle();

  if (!org) notFound();

  const { data: members } = await supabase
    .from("org_memberships")
    .select("id, invited_email, role, accepted_at, invited_at")
    .eq("org_id", orgId)
    .order("invited_at", { ascending: false });

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status, progress_pct, start_date, engagement_note")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  const updateThisOrg = updateOrganization.bind(null, orgId);
  const deleteThisOrg = deleteOrganization.bind(null, orgId);
  const createThisProject = createProject.bind(null, orgId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          All clients
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-medium text-primary">
            {org.name}
          </h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              STATUS_STYLES[org.status] ?? STATUS_STYLES.onboarding
            }`}
          >
            {org.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Details
        </p>
        <h2 className="mt-2 font-display text-lg font-medium text-primary">
          Edit client
        </h2>
        <form action={updateThisOrg} className="mt-5 flex flex-wrap items-end gap-3">
          <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-secondary">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={org.name}
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-sm font-medium text-secondary">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={org.status}
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cvr_number" className="text-sm font-medium text-secondary">
              CVR number
            </label>
            <input
              id="cvr_number"
              name="cvr_number"
              defaultValue={org.cvr_number ?? ""}
              placeholder="12345678"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
            <label htmlFor="billing_address" className="text-sm font-medium text-secondary">
              Billing address
            </label>
            <input
              id="billing_address"
              name="billing_address"
              defaultValue={org.billing_address ?? ""}
              placeholder="Street, postal code, city"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="rounded-full border border-primary px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Save changes
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Team
        </p>
        <h2 className="mt-2 font-display text-lg font-medium text-primary">
          Invite someone to this workspace
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          They&apos;ll be able to sign in at the client login using this
          email — no account setup needed on their end.
        </p>

        <InviteForm orgId={orgId} />

        {!members?.length ? (
          <p className="mt-6 text-sm text-muted-foreground">
            No one invited yet.
          </p>
        ) : (
          <div className="mt-6 divide-y divide-border border-t border-border">
            {members.map((m) => {
              const removeThisMember = removeMember.bind(null, orgId, m.id);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-primary">
                      {m.invited_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.role === "owner" ? "Owner" : "Collaborator"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        m.accepted_at
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {m.accepted_at ? "Active" : "Pending"}
                    </span>
                    <form action={removeThisMember}>
                      <ConfirmButton
                        confirmText={`Remove ${m.invited_email} from ${org.name}? They'll lose access immediately.`}
                        ariaLabel={`Remove ${m.invited_email} from ${org.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X size={16} />
                      </ConfirmButton>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Engagements
        </p>
        <h2 className="mt-2 font-display text-lg font-medium text-primary">
          Projects
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Each project gets its own board, decisions log, and files —
          {org.name} can run more than one at a time.
        </p>

        <form
          action={createThisProject}
          className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background p-4"
        >
          <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <label htmlFor="project-name" className="text-sm font-medium text-secondary">
              New project name
            </label>
            <input
              id="project-name"
              name="name"
              required
              placeholder="Coating formulation review"
              className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-start" className="text-sm font-medium text-secondary">
              Start date
            </label>
            <input
              id="project-start"
              name="start_date"
              type="date"
              className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
          >
            <Plus size={16} weight="bold" />
            Add project
          </button>
        </form>

        {!projects?.length ? (
          <p className="mt-6 text-sm text-muted-foreground">No projects yet.</p>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {projects.map((project) => {
              const updateThisProject = updateProject.bind(null, orgId, project.id);
              const deleteThisProject = deleteProject.bind(null, orgId, project.id);
              return (
                <div key={project.id} className="rounded-xl border border-border">
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                    <span className="font-medium text-primary">{project.name}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        PROJECT_STATUS_STYLES[project.status] ?? PROJECT_STATUS_STYLES.active
                      }`}
                    >
                      {project.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {project.progress_pct}%
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-2.5">
                    {[
                      { href: "board", label: "Board", icon: SquaresFour },
                      { href: "decisions", label: "Decisions", icon: ChatCircleDots },
                      { href: "files", label: "Files", icon: FolderOpen },
                      { href: "meetings", label: "Meetings", icon: VideoCamera },
                      { href: "updates", label: "Updates", icon: NotePencil },
                      { href: "hours", label: "Hours", icon: Clock },
                      { href: "invoices", label: "Invoices", icon: Receipt },
                      { href: "contracts", label: "Contracts", icon: FileText },
                    ].map(({ href, label, icon: ItemIcon }) => (
                      <Link
                        key={href}
                        href={`/admin/clients/${orgId}/projects/${project.id}/${href}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-muted hover:text-accent"
                      >
                        <ItemIcon size={13} />
                        {label}
                      </Link>
                    ))}
                  </div>

                  <details className="group border-t border-border">
                    <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary">
                      Manage
                    </summary>
                    <div className="border-t border-border p-4">
                      <form action={updateThisProject} className="flex flex-wrap items-end gap-3">
                      <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
                        <label className="text-sm font-medium text-secondary">Name</label>
                        <input
                          name="name"
                          required
                          defaultValue={project.name}
                          className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-secondary">Status</label>
                        <select
                          name="status"
                          defaultValue={project.status}
                          className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
                        >
                          {PROJECT_STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex w-24 flex-col gap-1.5">
                        <label className="text-sm font-medium text-secondary">Progress %</label>
                        <input
                          name="progress_pct"
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={project.progress_pct}
                          className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-secondary">Start date</label>
                        <input
                          name="start_date"
                          type="date"
                          defaultValue={project.start_date ?? ""}
                          className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
                        />
                      </div>
                      <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
                        <label className="text-sm font-medium text-secondary">
                          Engagement note
                        </label>
                        <input
                          name="engagement_note"
                          defaultValue={project.engagement_note ?? ""}
                          placeholder="Internal note about scope"
                          className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded-full border border-primary px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        Save
                      </button>
                    </form>

                    <form action={deleteThisProject} className="mt-4">
                      <ConfirmButton
                        confirmText={`Permanently delete "${project.name}" and its board, files, and decisions? This can't be undone.`}
                        className="inline-flex items-center gap-2 rounded-full border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash size={14} weight="bold" />
                        Delete project
                      </ConfirmButton>
                    </form>
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-destructive">
          Danger zone
        </p>
        <h2 className="mt-2 font-display text-lg font-medium text-primary">
          Delete this client
        </h2>
        <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
          Permanently deletes {org.name} and everything under it — team
          access, board, files, decisions, invoices. This can&apos;t be
          undone.
        </p>
        <form action={deleteThisOrg} className="mt-4">
          <ConfirmButton
            confirmText={`Permanently delete ${org.name} and everything under it? This can't be undone.`}
            className="inline-flex items-center gap-2 rounded-full border border-destructive/30 px-5 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash size={16} weight="bold" />
            Delete client
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
