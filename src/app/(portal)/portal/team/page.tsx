import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { updateOrgDetails } from "@/lib/actions/organization-details";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";

export default async function TeamPage() {
  const { org, role } = await getPortalProjectContext();

  if (!org) {
    return (
      <Stack spacing={4}>
        <SectionHeader eyebrow="Team" title="Team" />
        <EmptyState title="No workspace yet">
          Once you&apos;re added to a project, your team will show up here.
        </EmptyState>
      </Stack>
    );
  }

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("org_memberships")
    .select("id, invited_email, role, accepted_at")
    .eq("org_id", org.id)
    .not("accepted_at", "is", null)
    .order("role");

  const updateThisOrg = updateOrgDetails.bind(null, org.id);

  return (
    <Stack spacing={4}>
      <SectionHeader eyebrow="Team" title={org.name} />

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h2" sx={{ fontSize: 18 }}>
          Company details for your invoices
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 14, lineHeight: 1.6, color: "text.muted" }}>
          Your CVR number and billing address appear on invoices we send you.
        </Typography>

        {role === "owner" ? (
          <Box
            component="form"
            action={updateThisOrg}
            sx={{ mt: 2.5, display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 1.5 }}
          >
            <TextField
              name="cvr_number"
              label="CVR number"
              defaultValue={org.cvrNumber ?? ""}
              placeholder="12345678"
              fullWidth={false}
              sx={{ width: { xs: "100%", sm: 200 } }}
            />
            <TextField
              name="billing_address"
              label="Billing address"
              defaultValue={org.billingAddress ?? ""}
              placeholder="Street, postal code, city"
              sx={{ flex: 1, minWidth: 220 }}
            />
            <Button type="submit" variant="outlined" color="navy" sx={{ height: 40 }}>
              Save
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 2.5, display: "flex", flexWrap: "wrap", gap: 4 }}>
            <div>
              <Typography sx={{ fontSize: 12, color: "text.muted" }}>CVR number</Typography>
              <Typography sx={{ mt: 0.25, fontSize: 14 }}>{org.cvrNumber || "Not set"}</Typography>
            </div>
            <div>
              <Typography sx={{ fontSize: 12, color: "text.muted" }}>Billing address</Typography>
              <Typography sx={{ mt: 0.25, fontSize: 14 }}>{org.billingAddress || "Not set"}</Typography>
            </div>
          </Box>
        )}
      </Paper>

      {!members?.length ? (
        <Typography sx={{ fontSize: 14, color: "text.muted" }}>No team members yet.</Typography>
      ) : (
        <Paper variant="outlined">
          <List disablePadding>
            {members.map((m, i) => (
              <ListItem key={m.id} divider={i < members.length - 1} sx={{ px: 2.5, py: 1.5 }}>
                <ListItemAvatar sx={{ minWidth: 48 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: "var(--color-muted)", color: "text.muted" }}>
                    <GroupsOutlined sx={{ fontSize: 18 }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={m.invited_email}
                  secondary={m.role === "owner" ? "Owner" : "Collaborator"}
                  slotProps={{
                    primary: { sx: { fontSize: 14, fontWeight: 500 } },
                    secondary: { sx: { fontSize: 12, color: "text.muted" } },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Stack>
  );
}
