import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChatCircleDots,
  Clock,
  FileText,
  FolderOpen,
  NotePencil,
  Receipt,
  SquaresFour,
  Trash,
  VideoCamera,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { ConfirmButton } from "@/components/confirm-button";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { SelectField } from "@/components/shared/select-field";
import { ClientSettingsDrawer } from "@/components/admin/client-settings-drawer";
import { NewProjectPopover } from "@/components/admin/new-project-popover";
import { InviteForm } from "./invite-form";
import { ResendInviteButton } from "./resend-invite-button";
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

const fieldInputClass =
  "rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent";

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
      <SectionHeader
        backLink={{ href: "/admin/clients", label: "All clients" }}
        title={org.name}
        titleExtra={<StatusBadge status={org.status} tone="dark" />}
        actions={
          <ClientSettingsDrawer>
            <div className="flex flex-col gap-8">
              <section className="flex flex-col gap-4">
                <p className="font-mono text-xs uppercase tracking-widest text-accent">
                  Client details
                </p>
                <form action={updateThisOrg} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className="text-sm font-medium text-secondary">
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      required
                      defaultValue={org.name}
                      className={fieldInputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="status" className="text-sm font-medium text-secondary">
                      Status
                    </label>
                    <SelectField id="status" name="status" defaultValue={org.status}>
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </SelectField>
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
                      className={fieldInputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="billing_address"
                      className="text-sm font-medium text-secondary"
                    >
                      Billing address
                    </label>
                    <input
                      id="billing_address"
                      name="billing_address"
                      defaultValue={org.billing_address ?? ""}
                      placeholder="Street, postal code, city"
                      className={fieldInputClass}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary self-start rounded-full px-5 py-2.5 text-sm font-medium"
                  >
                    Save changes
                  </button>
                </form>
              </section>

              <div className="h-px bg-border" />

              <section className="flex flex-col gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-accent">Team</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Invited members sign in at the client login with this email — no account
                    setup needed on their end.
                  </p>
                </div>

                <InviteForm orgId={orgId} />

                {!members?.length ? (
                  <p className="text-sm text-muted-foreground">No one invited yet.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-border border-t border-border">
                    {members.map((m) => {
                      const removeThisMember = removeMember.bind(null, orgId, m.id);
                      return (
                        <div key={m.id} className="flex flex-col gap-2 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 truncate text-sm font-medium text-primary">
                              {m.invited_email}
                            </p>
                            <StatusBadge
                              status={m.accepted_at ? "active" : "onboarding"}
                              label={m.accepted_at ? "Active" : "Pending"}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                              {m.role === "owner" ? "Owner" : "Collaborator"}
                            </p>
                            <div className="flex items-center gap-1">
                              {!m.accepted_at && (
                                <ResendInviteButton orgId={orgId} email={m.invited_email} />
                              )}
                              <form action={removeThisMember}>
                                <ConfirmButton
                                  confirmText={`Remove ${m.invited_email} from ${org.name}? They'll lose access immediately.`}
                                  ariaLabel={`Remove ${m.invited_email} from ${org.name}`}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <X size={15} />
                                </ConfirmButton>
                              </form>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <div className="h-px bg-border" />

              <section>
                <form action={deleteThisOrg}>
                  <ConfirmButton
                    confirmText={`Permanently delete ${org.name} and everything under it — team access, board, files, decisions, invoices? This can't be undone.`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive/70 transition-colors hover:text-destructive"
                  >
                    <Trash size={14} />
                    Delete this client
                  </ConfirmButton>
                </form>
              </section>
            </div>
          </ClientSettingsDrawer>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-medium text-primary">Projects</h2>
          <NewProjectPopover createAction={createThisProject} />
        </div>

        {!projects?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="font-display text-lg font-medium text-primary">No projects yet</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Start {org.name}&apos;s first engagement above.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map((project) => {
              const updateThisProject = updateProject.bind(null, orgId, project.id);
              const deleteThisProject = deleteProject.bind(null, orgId, project.id);
              return (
                <div
                  key={project.id}
                  className="rounded-2xl border border-border bg-card transition-shadow hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <span className="font-display text-base font-medium text-primary">
                      {project.name}
                    </span>
                    <StatusBadge status={project.status} />
                    <span className="font-mono text-xs text-muted-foreground">
                      {project.progress_pct}%
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 border-t border-border px-5 py-3">
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
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                      >
                        <ItemIcon size={13} />
                        {label}
                      </Link>
                    ))}
                  </div>

                  <details className="group border-t border-border">
                    <summary className="cursor-pointer list-none px-5 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary">
                      Edit project
                    </summary>
                    <div className="flex flex-col gap-5 border-t border-border p-5">
                      <form action={updateThisProject} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-secondary">Name</label>
                            <input
                              name="name"
                              required
                              defaultValue={project.name}
                              className={fieldInputClass}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-secondary">Status</label>
                            <SelectField name="status" defaultValue={project.status}>
                              {PROJECT_STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </SelectField>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-secondary">
                              Progress %
                            </label>
                            <input
                              name="progress_pct"
                              type="number"
                              min={0}
                              max={100}
                              defaultValue={project.progress_pct}
                              className={fieldInputClass}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-secondary">
                              Start date
                            </label>
                            <input
                              name="start_date"
                              type="date"
                              defaultValue={project.start_date ?? ""}
                              className={fieldInputClass}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <label className="text-sm font-medium text-secondary">
                              Engagement note
                            </label>
                            <input
                              name="engagement_note"
                              defaultValue={project.engagement_note ?? ""}
                              placeholder="Internal note about scope"
                              className={fieldInputClass}
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="btn-primary self-start rounded-full px-5 py-2.5 text-sm font-medium"
                        >
                          Save
                        </button>
                      </form>

                      <form action={deleteThisProject}>
                        <ConfirmButton
                          confirmText={`Permanently delete "${project.name}" and its board, files, and decisions? This can't be undone.`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive/70 transition-colors hover:text-destructive"
                        >
                          <Trash size={14} />
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
    </div>
  );
}
