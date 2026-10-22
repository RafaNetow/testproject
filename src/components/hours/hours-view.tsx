import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { SelectField } from "@/components/shared/select-field";
import { StatTiles } from "@/components/shared/stat-tiles";
import { logHours, updateHoursEntry, deleteHoursEntry } from "@/lib/actions/hours";
import { EditableHoursRow } from "./editable-hours-row";
import { HOUR_CATEGORIES } from "@/lib/hour-categories";
import { Add } from "@/components/icons";
import { SubmitButton } from "@/components/shared/submit-button";

type HoursEntry = {
  id: string;
  entry_date: string;
  hours: number;
  category: string | null;
  description: string | null;
  billable: boolean;
  invoice_id: string | null;
};

export function HoursView({
  projectId,
  entries,
  revalidatePaths,
  canLog,
}: {
  projectId: string;
  entries: HoursEntry[];
  revalidatePaths: string[];
  canLog: boolean;
}) {
  const logForThisProject = logHours.bind(null, projectId, revalidatePaths);

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
  const billableHours = entries.filter((e) => e.billable).reduce((sum, e) => sum + Number(e.hours), 0);

  return (
    <Stack spacing={3}>
      <StatTiles
        columns={2}
        tiles={[
          { label: "Total hours logged", value: totalHours.toFixed(1) },
          { label: "Billable hours", value: billableHours.toFixed(1) },
        ]}
      />

      {canLog && (
        <Paper
          component="form"
          action={logForThisProject}
          variant="outlined"
          sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, p: 2.5 }}
        >
          <TextField
            name="entry_date"
            label="Date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth={false}
            sx={{ width: 170 }}
          />
          <TextField
            name="hours"
            label="Hours"
            type="number"
            required
            placeholder="1.5"
            slotProps={{ htmlInput: { min: 0, step: 0.25 } }}
            fullWidth={false}
            sx={{ width: 100 }}
          />
          <SelectField name="category" label="Category" defaultValue={HOUR_CATEGORIES[0]} sx={{ width: 180 }}>
            {HOUR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
          <TextField
            name="description"
            label="Description (optional)"
            placeholder="What you worked on"
            sx={{ flex: 1, minWidth: 200 }}
          />
          <FormControlLabel control={<Checkbox name="billable" defaultChecked />} label="Billable" />
          <SubmitButton variant="contained" startIcon={<Add />}>
            Log time
          </SubmitButton>
        </Paper>
      )}

      {!entries.length ? (
        <Typography sx={{ fontSize: 14, color: "text.muted" }}>No hours logged yet.</Typography>
      ) : (
        <Box className="stagger" sx={{ borderTop: 1, borderColor: "divider" }}>
          {entries.map((e) => {
            const updateThis = canLog ? updateHoursEntry.bind(null, e.id, revalidatePaths) : undefined;
            const deleteThis = canLog ? deleteHoursEntry.bind(null, e.id, revalidatePaths) : undefined;
            return <EditableHoursRow key={e.id} entry={e} updateAction={updateThis} deleteAction={deleteThis} />;
          })}
        </Box>
      )}
    </Stack>
  );
}
