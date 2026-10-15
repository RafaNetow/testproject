"use client";

import { useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ConfirmButton } from "@/components/confirm-button";
import { addPhase, deletePhase, movePhase, updatePhase } from "@/lib/actions/phases";
import type { ProgressPhase } from "@/components/shared/project-progress";
import { Add, ArrowDownward, ArrowUpward, DeleteOutlined } from "@/components/icons";

/**
 * Admin editor for a project's stages: rename, set each stage's percentage
 * (slider or number), reorder and delete. Every change saves on its own —
 * on blur or when the slider is released — and the client sees it on their
 * Executive Summary.
 */
export function PhaseEditor({ projectId, phases }: { projectId: string; phases: ProgressPhase[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await task();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {phases.length === 0 && (
        <Typography sx={{ fontSize: 14, color: "text.muted" }}>No stages yet — add the first one below.</Typography>
      )}

      {phases.map((phase, i) => (
        // Keyed on the saved values so a row resets to the server's state after each save.
        <PhaseRow
          key={`${phase.id}:${phase.name}:${phase.progress_pct}:${phase.start_date ?? ""}:${phase.end_date ?? ""}`}
          phase={phase}
          index={i}
          isFirst={i === 0}
          isLast={i === phases.length - 1}
          disabled={pending}
          onSave={(fields) => {
            const formData = new FormData();
            for (const [k, v] of Object.entries(fields)) formData.set(k, String(v));
            run(() => updatePhase(phase.id, formData));
          }}
          onMove={(direction) => run(() => movePhase(phase.id, direction))}
        />
      ))}

      <Box
        component="form"
        action={async (formData: FormData) => {
          setError(null);
          try {
            await addPhase(projectId, formData);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't add the stage.");
          }
        }}
        sx={{ display: "flex", alignItems: "center", gap: 1, pt: 0.5 }}
      >
        <TextField name="name" required placeholder="New stage, e.g. Main experiments" slotProps={{ htmlInput: { "aria-label": "New stage name", maxLength: 80 } }} />
        <Button type="submit" variant="outlined" color="secondary" startIcon={<Add />} sx={{ flexShrink: 0 }}>
          Add stage
        </Button>
      </Box>
    </Stack>
  );
}

function PhaseRow({
  phase,
  index,
  isFirst,
  isLast,
  disabled,
  onSave,
  onMove,
}: {
  phase: ProgressPhase;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onSave: (fields: { name?: string; progress_pct?: number; start_date?: string; end_date?: string }) => void;
  onMove: (direction: "up" | "down") => void;
}) {
  const [pct, setPct] = useState(phase.progress_pct);

  function commitPct(value: number) {
    const clamped = Math.min(100, Math.max(0, Math.round(value)));
    setPct(clamped);
    if (clamped !== phase.progress_pct) onSave({ progress_pct: clamped });
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "28px minmax(160px, 1fr) minmax(200px, 1.4fr) auto" },
        alignItems: "center",
        columnGap: 2,
        rowGap: 1,
        p: 1.5,
        borderRadius: 1.5,
        border: "1px dashed var(--border-dashed)",
      }}
    >
      <Box
        sx={{
          display: { xs: "none", md: "grid" },
          placeItems: "center",
          width: 28,
          height: 28,
          borderRadius: "50%",
          bgcolor: "var(--fill-neutral)",
          fontSize: 13,
          fontWeight: 700,
          color: "text.secondary",
        }}
      >
        {index + 1}
      </Box>

      <TextField
        defaultValue={phase.name}
        slotProps={{ htmlInput: { "aria-label": `Stage ${index + 1} name`, maxLength: 80 } }}
        onBlur={(e) => {
          const name = e.target.value.trim();
          if (name && name !== phase.name) onSave({ name });
          else e.target.value = phase.name;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Slider
          value={pct}
          onChange={(_, v) => setPct(v as number)}
          onChangeCommitted={(_, v) => commitPct(v as number)}
          step={5}
          disabled={disabled}
          aria-label={`${phase.name} progress`}
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => `${v}%`}
          sx={{ flex: 1, color: pct >= 100 ? "text.secondary" : "primary.main" }}
        />
        <TextField
          type="number"
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          onBlur={() => commitPct(pct)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          fullWidth={false}
          slotProps={{ htmlInput: { min: 0, max: 100, "aria-label": `${phase.name} percent` } }}
          sx={{ width: 84 }}
        />
      </Box>

      {/* Dates put the stage on the client's timeline; leave empty to keep it off. */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, gridColumn: { md: "2 / 4" } }}>
        {(["start_date", "end_date"] as const).map((key) => (
          <TextField
            key={key}
            type="date"
            label={key === "start_date" ? "Starts" : "Ends"}
            defaultValue={phase[key] ?? ""}
            fullWidth={false}
            onBlur={(e) => {
              if (e.target.value !== (phase[key] ?? "")) onSave({ [key]: e.target.value });
            }}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { "aria-label": `${phase.name} ${key === "start_date" ? "start" : "end"} date` } }}
            sx={{ width: 170 }}
          />
        ))}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: { xs: "flex-end", md: "flex-start" }, gridRow: { md: "1" }, gridColumn: { md: "4" } }}>
        <Tooltip title="Move up">
          <span>
            <IconButton size="small" aria-label={`Move ${phase.name} up`} disabled={isFirst || disabled} onClick={() => onMove("up")}>
              <ArrowUpward sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Move down">
          <span>
            <IconButton size="small" aria-label={`Move ${phase.name} down`} disabled={isLast || disabled} onClick={() => onMove("down")}>
              <ArrowDownward sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <form action={deletePhase.bind(null, phase.id)}>
          <ConfirmButton
            confirmText={`Remove the stage "${phase.name}"? The client will no longer see it.`}
            ariaLabel={`Remove stage ${phase.name}`}
            confirmLabel="Remove"
            icon={<DeleteOutlined sx={{ fontSize: 18 }} />}
          />
        </form>
      </Box>
    </Box>
  );
}
