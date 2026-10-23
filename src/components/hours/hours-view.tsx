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
import { GaugeMeter, WeeklyBars } from "@/components/charts/charts";
import { weekLabels, weeklySums } from "@/lib/weekly";

const WEEKS = 8;

/** Request time; kept out of the component body so render stays pure. */
function currentTime() {
  return new Date();
}

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
  const now = currentTime();
  const labels = weekLabels(WEEKS, now);
  const perWeek = (billable: boolean) =>
    weeklySums(entries.filter((e) => e.billable === billable).map((e) => ({ date: e.entry_date, value: Number(e.hours) })), WEEKS, now);

  return (
    <Stack spacing={3}>
      <StatTiles
        columns={2}
        animate
        tiles={[
          { label: "Total hours logged", value: Math.round(totalHours * 10) / 10, decimals: 1 },
          { label: "Billable hours", value: Math.round(billableHours * 10) / 10, decimals: 1 },
        ]}
      />

      {entries.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 3 }}>
          <Box sx={{ flex: 1, minWidth: 260 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Hours per week</Typography>
            <Typography sx={{ fontSize: 12, color: "text.muted" }}>Last {WEEKS} weeks</Typography>
            <WeeklyBars
              labels={labels}
              stacked
              unit="h"
              height={220}
              label={`Hours per week for the last ${WEEKS} weeks, billable and non-billable`}
              series={[
                { id: "billable", label: "Billable", data: perWeek(true), token: "--color-accent" },
                { id: "other", label: "Not billable", data: perWeek(false), token: "--color-muted-foreground" },
              ]}
            />
          </Box>
          <Box sx={{ mx: "auto", display: "grid", justifyItems: "center", gap: 1 }}>
            <GaugeMeter
              value={totalHours ? (billableHours / totalHours) * 100 : 0}
              size={170}
              caption="billable"
              label={`${totalHours ? Math.round((billableHours / totalHours) * 100) : 0}% of hours are billable`}
            />
          </Box>
        </Paper>
      )}

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
