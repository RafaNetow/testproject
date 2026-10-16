"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { StatusBadge } from "@/components/shared/status-badge";
import { ArrowForward, Close, VideocamOutlined } from "@/components/icons";
import { eventDays, formatDay, formatTime, type CalendarEvent } from "@/lib/calendar";
import { KIND_META, eventColor, isOverdue } from "./event-kinds";

/** When an event happens, in words: "Fri 16 Oct · 14:30–15:00" or "Due Fri 16 Oct". */
export function describeWhen(e: CalendarEvent): string {
  const { first, last } = eventDays(e);
  if (!e.allDay) {
    const range = `${formatTime(e.start)}–${formatTime(e.end)}`;
    return first === last ? `${formatDay(first)} · ${range}` : `${formatDay(first)} ${formatTime(e.start)} – ${formatDay(last)} ${formatTime(e.end)}`;
  }
  if (first !== last) return `${formatDay(first)} – ${formatDay(last)}`;
  return e.kind === "stage" ? formatDay(first) : `Due ${formatDay(first)}`;
}

export function EventPopover({
  event,
  anchorEl,
  today,
  onClose,
}: {
  event: CalendarEvent | null;
  anchorEl: HTMLElement | null;
  today: string;
  onClose: () => void;
}) {
  const open = Boolean(event && anchorEl);
  const meta = event ? KIND_META[event.kind] : null;
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{ paper: { sx: { width: 320, maxWidth: "calc(100vw - 32px)", p: 2 }, role: "dialog", "aria-label": event?.title } }}
    >
      {event && meta && (
        <Stack spacing={1.25}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <Box
              sx={{
                mt: 0.25,
                display: "grid",
                placeItems: "center",
                width: 28,
                height: 28,
                flexShrink: 0,
                borderRadius: 1,
                color: eventColor(event, today),
                bgcolor: `color-mix(in srgb, ${eventColor(event, today)} 12%, transparent)`,
              }}
            >
              <meta.Icon sx={{ fontSize: 16 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 12, color: "text.muted" }}>{meta.label}</Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35, overflowWrap: "anywhere" }}>{event.title}</Typography>
            </Box>
            <IconButton size="small" onClick={onClose} aria-label="Close" sx={{ mt: -0.5, mr: -0.75 }}>
              <Close sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          <Box sx={{ pl: 4.5 }}>
            <Typography sx={{ fontSize: 14 }}>{describeWhen(event)}</Typography>
            {event.context && <Typography sx={{ fontSize: 13, color: "text.muted" }}>{event.context}</Typography>}
            {(event.status || isOverdue(event, today)) && (
              <Box sx={{ mt: 1, display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                {event.status && <StatusBadge status={event.status} />}
                {isOverdue(event, today) && <StatusBadge status="overdue" />}
              </Box>
            )}
          </Box>

          {(event.joinUrl || event.href) && (
            <Box sx={{ pl: 4.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {event.joinUrl && (
                <Button
                  href={event.joinUrl}
                  target="_blank"
                  rel="noreferrer"
                  variant="contained"
                  size="small"
                  startIcon={<VideocamOutlined />}
                >
                  Join
                </Button>
              )}
              {event.href && (
                <Button
                  href={event.href}
                  target={event.kind === "google" ? "_blank" : undefined}
                  rel={event.kind === "google" ? "noreferrer" : undefined}
                  variant="outlined"
                  color="secondary"
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={onClose}
                >
                  {event.kind === "google" ? "Open in Google" : "Open"}
                </Button>
              )}
            </Box>
          )}
        </Stack>
      )}
    </Popover>
  );
}
