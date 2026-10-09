import { notFound } from "next/navigation";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import Close from "@mui/icons-material/Close";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FolderOpenOutlined from "@mui/icons-material/FolderOpenOutlined";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import ViewKanbanOutlined from "@mui/icons-material/ViewKanbanOutlined";
import { createClient } from "@/lib/supabase/server";
import { ConfirmButton } from "@/components/confirm-button";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { SelectField } from "@/components/shared/select-field";
import { LinkChip } from "@/components/shared/link-chip";
import { EmptyState } from "@/components/shared/empty-state";
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

const PROJECT_SECTIONS = [
  { href: "board", label: "Board", icon: ViewKanbanOutlined },
  { href: "deliverables", label: "Deliverables", icon: Inventory2Outlined },
  { href: "decisions", label: "Decisions", icon: ForumOutlined },
  { href: "files", label: "Files", icon: FolderOpenOutlined },
  { href: "meetings", label: "Meetings", icon: VideocamOutlined },
  { href: "updates", label: "Updates", icon: EditNoteOutlined },
  { href: "hours", label: "Hours", icon: AccessTimeOutlined },
  { href: "invoices", label: "Invoices", icon: ReceiptLongOutlined },
  { href: "contracts", label: "Contracts", icon: DescriptionOutlined },
];

export default async function ClientDetailPage({ params }: { params: Promise<{ orgId: string }> }) {
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
    <Stack spacing={4}>
      <SectionHeader
        backLink={{ href: "/admin/clients", label: "All clients" }}
        title={org.name}
        titleExtra={<StatusBadge status={org.status} tone="dark" />}
        actions={
          <ClientSettingsDrawer>
            <Stack spacing={4}>
              <Stack component="section" spacing={2}>
                <Typography variant="h3" sx={{ fontSize: 16 }}>
                  Client details
                </Typography>
                <Stack component="form" action={updateThisOrg} spacing={2}>
                  <TextField name="name" label="Name" required defaultValue={org.name} />
                  <SelectField name="status" label="Status" defaultValue={org.status}>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </SelectField>
                  <TextField name="cvr_number" label="CVR number" defaultValue={org.cvr_number ?? ""} placeholder="12345678" />
                  <TextField
                    name="billing_address"
                    label="Billing address"
                    defaultValue={org.billing_address ?? ""}
                    placeholder="Street, postal code, city"
                  />
                  <Box>
                    <Button type="submit" variant="contained">
                      Save changes
                    </Button>
                  </Box>
                </Stack>
              </Stack>

              <Divider />

              <Stack component="section" spacing={2}>
                <div>
                  <Typography variant="h3" sx={{ fontSize: 16 }}>
                    Team
                  </Typography>
                  <Typography sx={{ mt: 1, fontSize: 14, lineHeight: 1.6, color: "text.muted" }}>
                    Invited members sign in at the client login with this email — no account setup needed on their end.
                  </Typography>
                </div>

                <InviteForm orgId={orgId} />

                {!members?.length ? (
                  <Typography sx={{ fontSize: 14, color: "text.muted" }}>No one invited yet.</Typography>
                ) : (
                  <Box sx={{ borderTop: 1, borderColor: "divider" }}>
                    {members.map((m) => {
                      const removeThisMember = removeMember.bind(null, orgId, m.id);
                      return (
                        <Stack key={m.id} spacing={1} sx={{ py: 1.5, borderBottom: 1, borderColor: "divider" }}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                            <Typography noWrap sx={{ minWidth: 0, fontSize: 14, fontWeight: 500 }}>
                              {m.invited_email}
                            </Typography>
                            <StatusBadge status={m.accepted_at ? "active" : "onboarding"} label={m.accepted_at ? "Active" : "Pending"} />
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                            <Typography sx={{ fontSize: 12, color: "text.muted" }}>
                              {m.role === "owner" ? "Owner" : "Collaborator"}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              {!m.accepted_at && <ResendInviteButton orgId={orgId} email={m.invited_email} />}
                              <form action={removeThisMember}>
                                <ConfirmButton
                                  confirmText={`Remove ${m.invited_email} from ${org.name}? They'll lose access immediately.`}
                                  ariaLabel={`Remove ${m.invited_email} from ${org.name}`}
                                  confirmLabel="Remove"
                                  icon={<Close sx={{ fontSize: 17 }} />}
                                />
                              </form>
                            </Box>
                          </Box>
                        </Stack>
                      );
                    })}
                  </Box>
                )}
              </Stack>

              <Divider />

              <section>
                <form action={deleteThisOrg}>
                  <ConfirmButton
                    confirmText={`Permanently delete ${org.name} and everything under it — team access, board, files, decisions, invoices? This can't be undone.`}
                    ariaLabel={`Delete client ${org.name}`}
                    icon={<DeleteOutlined />}
                    color="error"
                  >
                    Delete this client
                  </ConfirmButton>
                </form>
              </section>
            </Stack>
          </ClientSettingsDrawer>
        }
      />

      <Stack spacing={2}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Typography variant="h2" sx={{ fontSize: 20 }}>
            Projects
          </Typography>
          <NewProjectPopover createAction={createThisProject} />
        </Box>

        {!projects?.length ? (
          <EmptyState title="No projects yet">Start {org.name}&apos;s first engagement above.</EmptyState>
        ) : (
          <Stack spacing={2}>
            {projects.map((project) => {
              const updateThisProject = updateProject.bind(null, orgId, project.id);
              const deleteThisProject = deleteProject.bind(null, orgId, project.id);
              return (
                <Paper key={project.id} variant="outlined" sx={{ overflow: "hidden", transition: "box-shadow 150ms", "&:hover": { boxShadow: 1 } }}>
                  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, px: 2.5, py: 2 }}>
                    <Typography variant="h3" sx={{ fontSize: 16 }}>
                      {project.name}
                    </Typography>
                    <StatusBadge status={project.status} />
                    <Typography component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "text.muted" }}>
                      {project.progress_pct}%
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, borderTop: 1, borderColor: "divider", px: 2.5, py: 1.5 }}>
                    {PROJECT_SECTIONS.map(({ href, label, icon: ItemIcon }) => (
                      <LinkChip
                        key={href}
                       
                        href={`/admin/clients/${orgId}/projects/${project.id}/${href}`}
                        variant="outlined"
                        icon={<ItemIcon sx={{ fontSize: 15 }} />}
                        label={label}
                        sx={{ fontSize: 12, "&:hover": { borderColor: "primary.main", color: "primary.main", "& .MuiChip-icon": { color: "primary.main" } } }}
                      />
                    ))}
                  </Box>

                  <Accordion disableGutters elevation={0} sx={{ borderTop: 1, borderColor: "divider", bgcolor: "transparent", "&::before": { display: "none" } }}>
                    <AccordionSummary
                      expandIcon={<ExpandMore sx={{ fontSize: 18 }} />}
                      sx={{ px: 2.5, minHeight: 40, "& .MuiAccordionSummary-content": { my: 1 } }}
                    >
                      <Typography sx={{ fontSize: 12, fontWeight: 500, color: "text.muted" }}>Edit project</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ borderTop: 1, borderColor: "divider", p: 2.5 }}>
                      <Stack spacing={2.5}>
                        <Stack component="form" action={updateThisProject} spacing={2}>
                          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" } }}>
                            <TextField name="name" label="Name" required defaultValue={project.name} />
                            <SelectField name="status" label="Status" defaultValue={project.status}>
                              {PROJECT_STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </SelectField>
                            <TextField
                              name="progress_pct"
                              label="Progress %"
                              type="number"
                              defaultValue={project.progress_pct}
                              slotProps={{ htmlInput: { min: 0, max: 100 } }}
                            />
                            <TextField
                              name="start_date"
                              label="Start date"
                              type="date"
                              defaultValue={project.start_date ?? ""}
                              slotProps={{ inputLabel: { shrink: true } }}
                            />
                            <TextField
                              name="engagement_note"
                              label="Engagement note"
                              defaultValue={project.engagement_note ?? ""}
                              placeholder="Internal note about scope"
                              sx={{ gridColumn: { sm: "span 2" } }}
                            />
                          </Box>
                          <Box>
                            <Button type="submit" variant="contained">
                              Save
                            </Button>
                          </Box>
                        </Stack>

                        <form action={deleteThisProject}>
                          <ConfirmButton
                            confirmText={`Permanently delete "${project.name}" and its board, files, and decisions? This can't be undone.`}
                            ariaLabel={`Delete project ${project.name}`}
                            icon={<DeleteOutlined />}
                            color="error"
                          >
                            Delete project
                          </ConfirmButton>
                        </form>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
