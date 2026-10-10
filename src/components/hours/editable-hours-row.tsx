"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Close from "@mui/icons-material/Close";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { ConfirmButton } from "@/components/confirm-button";
import { figureSx } from "@/lib/palette";
import { SelectField } from "@/components/shared/select-field";
import { StatusBadge } from "@/components/shared/status-badge";

export const HOUR_CATEGORIES = ["Analysis", "Formulation work", "Meeting", "Report writing", "Other"];

type HoursEntry = {
  id: string;
  entry_date: string;
  hours: number;
  category: string | null;
  description: string | null;
  billable: boolean;
  invoice_id: string | null;
};

const rowSx = { borderBottom: 1, borderColor: "divider", py: 1.75 } as const;

export function EditableHoursRow({
  entry,
  updateAction,
  deleteAction,
}: {
  entry: HoursEntry;
  updateAction?: (formData: FormData) => void;
  deleteAction?: (formData: FormData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const canManage = Boolean(updateAction && deleteAction);

  if (editing && updateAction) {
    return (
      <Box
        component="form"
        action={(formData: FormData) => {
          updateAction(formData);
          setEditing(false);
        }}
        sx={{ ...rowSx, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}
      >
        <TextField
          name="entry_date"
          label="Date"
          type="date"
          required
          defaultValue={entry.entry_date}
          slotProps={{ inputLabel: { shrink: true } }}
          fullWidth={false}
          sx={{ width: 170 }}
        />
        <TextField
          name="hours"
          label="Hours"
          type="number"
          required
          defaultValue={entry.hours}
          slotProps={{ htmlInput: { min: 0, step: 0.25 } }}
          fullWidth={false}
          sx={{ width: 100 }}
        />
        <SelectField name="category" label="Category" defaultValue={entry.category ?? HOUR_CATEGORIES[0]} sx={{ width: 180 }}>
          {HOUR_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>
        <TextField name="description" label="Description" defaultValue={entry.description ?? ""} sx={{ flex: 1, minWidth: 180 }} />
        <FormControlLabel control={<Checkbox name="billable" defaultChecked={entry.billable} />} label="Billable" />
        <Button type="submit" variant="contained" size="small">
          Save
        </Button>
        <IconButton size="small" aria-label="Cancel editing" onClick={() => setEditing(false)}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box sx={{ ...rowSx, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
        <Typography component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "text.muted" }}>
          {new Date(entry.entry_date).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
        </Typography>
        <Typography component="span" sx={{ ...figureSx, fontSize: 14, fontWeight: 600 }}>
          {Number(entry.hours).toFixed(2)}h
        </Typography>
        {entry.category && <Chip size="small" label={entry.category} sx={{ height: 22, fontSize: 12 }} />}
        {!entry.billable && (
          <Chip size="small" color="primary" variant="outlined" label="Non-billable" sx={{ height: 22, fontSize: 12 }} />
        )}
        {entry.invoice_id && <StatusBadge status="paid" label="Invoiced" />}
        {entry.description && (
          <Typography component="span" sx={{ fontSize: 14, color: "text.secondary" }}>
            {entry.description}
          </Typography>
        )}
      </Box>
      {canManage && (
        <Box sx={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 0.5 }}>
          <IconButton
            size="small"
            aria-label={`Edit ${entry.hours} hour entry`}
            onClick={() => setEditing(true)}
            sx={{ color: "text.muted", "&:hover": { color: "primary.main" } }}
          >
            <EditOutlined sx={{ fontSize: 18 }} />
          </IconButton>
          <form action={deleteAction}>
            <ConfirmButton
              confirmText={`Delete this ${entry.hours}h entry?`}
              ariaLabel={`Delete ${entry.hours} hour entry`}
              icon={<DeleteOutlined sx={{ fontSize: 18 }} />}
            />
          </form>
        </Box>
      )}
    </Box>
  );
}
