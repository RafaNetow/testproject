"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Add from "@mui/icons-material/Add";
import { Popover } from "@/components/shared/popover";

export function NewProjectPopover({
  createAction,
}: {
  createAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <Popover
      align="right"
      trigger={({ toggle }) => (
        <Button variant="contained" startIcon={<Add />} onClick={toggle}>
          New project
        </Button>
      )}
    >
      {(close) => (
        <Stack component="form" action={createAction} onSubmit={close} spacing={2} sx={{ width: 320, p: 2 }}>
          <TextField name="name" label="Project name" required placeholder="Coating formulation review" />
          <TextField
            name="start_date"
            label="Start date"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button type="submit" variant="contained">
            Create project
          </Button>
        </Stack>
      )}
    </Popover>
  );
}
