import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Add from "@mui/icons-material/Add";
import ArrowForward from "@mui/icons-material/ArrowForward";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { createClient } from "@/lib/supabase/server";
import { ConfirmButton } from "@/components/confirm-button";
import { AutoSubmitSelect } from "@/components/board/auto-submit-select";
import { SectionHeader } from "@/components/shared/section-header";
import {
  createProspect,
  updateProspectStage,
  deleteProspect,
  convertProspectToClient,
} from "@/lib/actions/prospects";

const STAGES = [
  { value: "lead", label: "Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "proposal", label: "Proposal" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

function formatValue(cents: number | null) {
  if (!cents) return null;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "DKK" }).format(
    cents / 100
  );
}

export default async function ProspectsPage() {
  const supabase = await createClient();
  const { data: prospects } = await supabase
    .from("prospects")
    .select("id, company_name, contact_name, contact_email, stage, estimated_value_cents, notes")
    .order("created_at", { ascending: false });

  const byStage = (stage: string) => (prospects ?? []).filter((p) => p.stage === stage);

  return (
    <Stack spacing={4}>
      <SectionHeader eyebrow="Prospects" title="Sales pipeline" />

      <Paper
        variant="outlined"
        component="form"
        action={createProspect}
        sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.5, p: 2.5 }}
      >
        <TextField id="company-name" name="company_name" label="Company" required placeholder="Acme Materials" sx={{ flex: 1, minWidth: 180 }} />
        <TextField id="contact-name" name="contact_name" label="Contact name" placeholder="Jane Doe" sx={{ flex: 1, minWidth: 160 }} />
        <TextField
          id="contact-email"
          name="contact_email"
          label="Contact email"
          type="email"
          placeholder="jane@acme.com"
          sx={{ flex: 1, minWidth: 180 }}
        />
        <TextField
          id="estimated-value"
          name="estimated_value"
          label="Est. value"
          type="number"
          placeholder="50000"
          slotProps={{ htmlInput: { min: 0 } }}
          sx={{ width: 128 }}
        />
        <Button type="submit" variant="contained" startIcon={<Add />}>
          Add prospect
        </Button>
      </Paper>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" } }}>
        {STAGES.map((stage) => (
          <Paper key={stage.value} variant="outlined" sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h3" sx={{ fontSize: 14 }}>
                {stage.label}
              </Typography>
              <Typography component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "text.muted" }}>
                {byStage(stage.value).length}
              </Typography>
            </Box>
            <Stack spacing={1}>
              {byStage(stage.value).map((p) => {
                const updateThis = updateProspectStage.bind(null, p.id);
                const deleteThis = deleteProspect.bind(null, p.id);
                const convertThis = convertProspectToClient.bind(null, p.id);
                const value = formatValue(p.estimated_value_cents);
                return (
                  <Paper key={p.id} variant="outlined" sx={{ borderRadius: 3, p: 1.5 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{p.company_name}</Typography>
                    {(p.contact_name || p.contact_email) && (
                      <Typography sx={{ mt: 0.25, fontSize: 12, color: "text.muted", overflowWrap: "anywhere" }}>
                        {p.contact_name}
                        {p.contact_name && p.contact_email ? " · " : ""}
                        {p.contact_email}
                      </Typography>
                    )}
                    {value && <Typography sx={{ mt: 0.25, fontSize: 12, color: "text.muted" }}>{value}</Typography>}
                    {stage.value === "won" && (
                      <Box component="form" action={convertThis} sx={{ mt: 1 }}>
                        <ConfirmButton
                          confirmText={`Create a client workspace for "${p.company_name}"?`}
                          title="Convert to client?"
                          confirmLabel="Convert"
                          ariaLabel={`Convert ${p.company_name} to a client`}
                          variant="contained"
                          color="primary"
                          sx={{ width: "100%", "& .MuiButton-startIcon": { display: "none" } }}
                        >
                          Convert to client
                          <ArrowForward sx={{ ml: 0.75, fontSize: 14 }} />
                        </ConfirmButton>
                      </Box>
                    )}
                    <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                      <Box component="form" action={updateThis} sx={{ flex: 1, minWidth: 0 }}>
                        <AutoSubmitSelect
                          name="stage"
                          defaultValue={p.stage}
                          ariaLabel={`Stage for ${p.company_name}`}
                          options={STAGES.map((s) => ({ value: s.value, label: s.label }))}
                          sx={{ minWidth: 0, width: "100%" }}
                        />
                      </Box>
                      <form action={deleteThis}>
                        <ConfirmButton
                          confirmText={`Delete "${p.company_name}" from the pipeline?`}
                          ariaLabel={`Delete prospect ${p.company_name}`}
                          icon={<DeleteOutlined sx={{ fontSize: 17 }} />}
                        />
                      </form>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          </Paper>
        ))}
      </Box>
    </Stack>
  );
}
