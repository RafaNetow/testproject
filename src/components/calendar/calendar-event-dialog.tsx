"use client";

import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/en-gb";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Check, DeleteOutlined } from "@/components/icons";
import { SelectField } from "@/components/shared/select-field";
import { notifySuccess } from "@/components/shared/success-toast";
import { deleteOwnEvent, saveOwnEvent, scheduleMeetingFromCalendar, updateMeetingFromCalendar } from "@/lib/actions/calendar";
import { deleteMeeting } from "@/lib/actions/meetings";
import { EVENT_COLORS, type EventColor } from "@/lib/calendar-floating";

export type DialogDraft = {
  /** Present when editing. "event:<uuid>" or "meeting:<uuid>". */
  id?: string;
  type: "event" | "meeting";
  title: string;
  description: string;
  allDay: boolean;
  /** "YYYY-MM-DD" when all-day, else Copenhagen wall time "YYYY-MM-DDTHH:mm". */
  start: string;
  end: string;
  color: EventColor;
  projectId: string;
  zoomUrl: string;
  /** "Client · Project" for an existing meeting. */
  context?: string;
};

const LOCAL_FMT = "YYYY-MM-DDTHH:mm";
const DAY_FMT = "YYYY-MM-DD";

/**
 * Create or edit a calendar entry, as in the Minimal dashboard: title,
 * description, all day, start and end, and a colour. New entries can be the
 * admin's own event (only Axel sees it) or a client meeting (on a project;
 * the client sees it and is notified).
 */
export function CalendarEventDialog({
  draft,
  projects,
  onClose,
  onChanged,
}: {
  draft: DialogDraft | null;
  projects: { id: string; label: string }[];
  onClose: () => void;
  onChanged: () => void;
}) {
  // Re-mount the form for each draft so it starts from that draft's values.
  return (
    <Dialog open={Boolean(draft)} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="calendar-dialog-title">
      {draft && <Form key={draft.id ?? `${draft.start}-${draft.type}`} draft={draft} projects={projects} onClose={onClose} onChanged={onChanged} />}
    </Dialog>
  );
}

function Form({ draft, projects, onClose, onChanged }: { draft: DialogDraft; projects: { id: string; label: string }[]; onClose: () => void; onChanged: () => void }) {
  const [d, setD] = useState<DialogDraft>(draft);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const editing = Boolean(draft.id);
  const isMeeting = d.type === "meeting";
  const allDay = !isMeeting && d.allDay;
  const set = (patch: Partial<DialogDraft>) => setD((prev) => ({ ...prev, ...patch }));

  function toggleAllDay(next: boolean) {
    if (next) set({ allDay: true, start: d.start.slice(0, 10), end: d.end.slice(0, 10) });
    else set({ allDay: false, start: `${d.start.slice(0, 10)}T09:00`, end: `${d.end.slice(0, 10)}T10:00` });
  }

  function switchType(type: "event" | "meeting") {
    // Meetings always have a time of day.
    if (type === "meeting" && d.allDay) set({ type, allDay: false, start: `${d.start.slice(0, 10)}T09:00`, end: `${d.start.slice(0, 10)}T10:00` });
    else set({ type });
  }

  async function save() {
    setBusy(true);
    setError(null);
    const [kind, rowId] = (d.id ?? "").split(":");
    const result = isMeeting
      ? editing
        ? await updateMeetingFromCalendar(rowId, { title: d.title, start: d.start, end: d.end, zoomUrl: d.zoomUrl, notes: d.description })
        : await scheduleMeetingFromCalendar({ projectId: d.projectId, title: d.title, start: d.start, end: d.end, zoomUrl: d.zoomUrl, notes: d.description })
      : await saveOwnEvent({ id: kind === "event" ? rowId : undefined, title: d.title, description: d.description, start: d.start, end: d.end, allDay, color: d.color });
    setBusy(false);
    if (!result.ok) return setError(result.message);
    notifySuccess(editing ? `Saved "${d.title.trim()}"` : isMeeting ? `Scheduled "${d.title.trim()}"` : `Added "${d.title.trim()}"`);
    onChanged();
    onClose();
  }

  async function remove() {
    if (!d.id) return;
    setBusy(true);
    const [kind, rowId] = d.id.split(":");
    try {
      if (kind === "meeting") await deleteMeeting(rowId, ["/admin/calendar"]);
      else {
        const r = await deleteOwnEvent(rowId);
        if (!r.ok) throw new Error(r.message);
      }
    } catch (e) {
      setBusy(false);
      return setError(e instanceof Error ? e.message : "Couldn't delete it.");
    }
    setBusy(false);
    notifySuccess(`Deleted "${d.title}"`);
    onChanged();
    onClose();
  }

  const startValue = dayjs(d.start);
  const endValue = dayjs(d.end);
  const onStart = (v: Dayjs | null) => {
    if (!v?.isValid()) return;
    const fmt = allDay ? DAY_FMT : LOCAL_FMT;
    // Keep the length when the start moves.
    const length = endValue.diff(startValue, allDay ? "day" : "minute");
    set({ start: v.format(fmt), end: v.add(Math.max(length, 0), allDay ? "day" : "minute").format(fmt) });
  };
  const onEnd = (v: Dayjs | null) => v?.isValid() && set({ end: v.format(allDay ? DAY_FMT : LOCAL_FMT) });

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <DialogTitle id="calendar-dialog-title" sx={{ fontWeight: 700 }}>
        {editing ? (isMeeting ? "Edit meeting" : "Edit event") : "Add event"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {!editing && (
            <ToggleButtonGroup exclusive fullWidth size="small" value={d.type} onChange={(_, v) => v && switchType(v)} aria-label="What to add">
              <ToggleButton value="event" sx={{ textTransform: "none" }}>
                Your event
              </ToggleButton>
              <ToggleButton value="meeting" sx={{ textTransform: "none" }}>
                Client meeting
              </ToggleButton>
            </ToggleButtonGroup>
          )}
          {isMeeting && !editing && (
            <SelectField label="Client project" value={d.projectId} onChange={(e) => set({ projectId: String(e.target.value) })}>
              <option value="">Choose a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </SelectField>
          )}
          {isMeeting && editing && d.context && <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{d.context}</Typography>}
          <TextField label="Title" value={d.title} onChange={(e) => set({ title: e.target.value })} autoFocus required slotProps={{ htmlInput: { maxLength: 200 } }} />
          <TextField
            label={isMeeting ? "Notes" : "Description"}
            value={d.description}
            onChange={(e) => set({ description: e.target.value })}
            multiline
            minRows={3}
            slotProps={{ htmlInput: { maxLength: 2000 } }}
          />
          {!isMeeting && <FormControlLabel control={<Switch checked={d.allDay} onChange={(e) => toggleAllDay(e.target.checked)} />} label="All day" />}
          {allDay ? (
            <>
              <DatePicker label="Start date" value={startValue} onChange={onStart} format="ddd D MMM YYYY" />
              <DatePicker label="End date" value={endValue} onChange={onEnd} minDate={startValue} format="ddd D MMM YYYY" />
            </>
          ) : (
            <>
              <DateTimePicker label="Start" value={startValue} onChange={onStart} ampm={false} format="ddd D MMM YYYY · HH:mm" />
              <DateTimePicker label="End" value={endValue} onChange={onEnd} minDateTime={startValue} ampm={false} format="ddd D MMM YYYY · HH:mm" />
            </>
          )}
          {isMeeting ? (
            <TextField label="Video link (optional)" type="url" value={d.zoomUrl} onChange={(e) => set({ zoomUrl: e.target.value })} placeholder="https://…" />
          ) : (
            <Box role="radiogroup" aria-label="Colour" sx={{ display: "flex", gap: 1.25 }}>
              {(Object.keys(EVENT_COLORS) as EventColor[]).map((c) => (
                <ButtonBase
                  key={c}
                  role="radio"
                  aria-checked={d.color === c}
                  aria-label={c}
                  onClick={() => set({ color: c })}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: `var(${EVENT_COLORS[c]})`,
                    color: "#fff",
                    transition: "transform 150ms, box-shadow 150ms",
                    transform: d.color === c ? "scale(1.15)" : "none",
                    boxShadow: d.color === c ? `0 0 0 3px var(--color-card), 0 0 0 5px var(${EVENT_COLORS[c]})` : "none",
                  }}
                >
                  {d.color === c && <Check sx={{ fontSize: 15 }} />}
                </ButtonBase>
              ))}
            </Box>
          )}
          <Typography sx={{ fontSize: 12, color: "text.muted" }}>
            {isMeeting ? "Copenhagen time. The client sees this meeting and is notified." : "Copenhagen time. Only you see your own events."}
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {editing && (
          <Tooltip title="Delete">
            <IconButton aria-label="Delete" onClick={remove} disabled={busy} sx={{ mr: "auto", color: "error.main" }}>
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        )}
        <Button color="secondary" variant="outlined" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} loading={busy} disabled={!d.title.trim() || (isMeeting && !editing && !d.projectId)}>
          {editing ? "Save changes" : "Add"}
        </Button>
      </DialogActions>
    </LocalizationProvider>
  );
}
