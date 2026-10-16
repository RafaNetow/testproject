import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { createClient } from "@/lib/supabase/server";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkTable } from "@/components/shared/link-table";
import { createOrganization } from "./actions";
import { Add } from "@/components/icons";
import { SubmitButton } from "@/components/shared/submit-button";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <Stack spacing={4}>
      <SectionHeader eyebrow="Clients" title="All clients" />

      <Paper
        variant="outlined"
        component="form"
        action={createOrganization}
        sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.5, p: 2.5 }}
      >
        <TextField id="name" name="name" label="New client name" required placeholder="Acme Materials" sx={{ flex: 1, minWidth: 200 }} />
        <SubmitButton variant="contained" startIcon={<Add />}>
          Add client
        </SubmitButton>
      </Paper>

      {!organizations?.length ? (
        <EmptyState title="No clients yet">Add your first client above to start building out their workspace.</EmptyState>
      ) : (
        <LinkTable
          columns={["Name", "Status"]}
          rows={organizations.map((org) => ({
            key: org.id,
            href: `/admin/clients/${org.id}`,
            cells: [org.name, <StatusBadge key="status" status={org.status} />],
          }))}
        />
      )}
    </Stack>
  );
}
