"use client";

import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { StatusBadge } from "@/components/shared/status-badge";
import { ArrowBack, NavigateNext } from "@/components/icons";
import {
  eachDay,
  eventDays,
  formatDay,
  formatTime,
  groupByDay,
  layoutDay,
  monthGrid,
  stepDate,
  viewRange,
  viewTitle,
  weekDays,
  type CalendarEvent,
  type CalendarEventKind,
  type CalendarView as View,
} from "@/lib/calendar";
import { KIND_META, KIND_ORDER, eventColor, isOverdue } from "./event-kinds";
import { EventPopover, describeWhen } from "./event-popover";
import { MiniCalendar } from "./mini-calendar";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LIMIT = 3;
const PX_PER_MINUTE = 0.8; // 48px an hour
const DAY_WINDOW = { startMinute: 7 * 60, endMinute: 20 * 60 };

type OpenEvent = (event: CalendarEvent, anchor: HTMLElement) => void;

function label(e: CalendarEvent) {
  return `${KIND_META[e.kind].label}: ${e.title}, ${describeWhen(e)}${e.context ? `, ${e.context}` : ""}`;
}

/** One event as a small coloured line; a button that opens its details. */
function EventChip({ event, today, onOpen, compact }: { event: CalendarEvent; today: string; onOpen: OpenEvent; compact?: boolean }) {
  const color = eventColor(event, today);
  const { Icon } = KIND_META[event.kind];
  return (
    <ButtonBase
      onClick={(e: MouseEvent<HTMLButtonElement>) => onOpen(event, e.currentTarget)}
      aria-label={label(event)}
      sx={{
        width: "100%",
        justifyContent: "flex-start",
        gap: 0.5,
        minHeight: 22,
        px: 0.75,
        borderRadius: 0.75,
        borderLeft: 3,
        borderColor: color,
        bgcolor: `color-mix(in srgb, ${color} 10%, transparent)`,
        color: "text.primary",
        fontSize: 12,
        lineHeight: 1.4,
        textAlign: "left",
        textDecoration: event.status === "cancelled" ? "line-through" : undefined,
        "&:hover": { bgcolor: `color-mix(in srgb, ${color} 18%, transparent)` },
        "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.main", outlineOffset: 1 },
      }}
    >
      {!compact && <Icon aria-hidden sx={{ fontSize: 12, flexShrink: 0, color }} />}
      {!event.allDay && (
        <Box component="span" sx={{ flexShrink: 0, color: "text.muted", fontVariantNumeric: "tabular-nums" }}>
          {formatTime(event.start)}
        </Box>
      )}
      <Box component="span" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {event.title}
      </Box>
    </ButtonBase>
  );
}

function MonthView({
  date,
  today,
  byDay,
  onOpen,
  onMore,
  dayHref,
}: {
  date: string;
  today: string;
  byDay: Map<string, CalendarEvent[]>;
  onOpen: OpenEvent;
  onMore: (day: string, anchor: HTMLElement) => void;
  dayHref: (day: string) => string;
}) {
  const grid = monthGrid(date);
  const month = date.slice(0, 7);
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Box role="grid" aria-label={viewTitle("month", date)} sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        <Box role="row" sx={{ display: "contents" }}>
          {WEEKDAYS.map((d) => (
            <Box
              key={d}
              role="columnheader"
              sx={{ py: 1, textAlign: "center", fontSize: 12, fontWeight: 600, color: "text.muted", borderBottom: 1, borderColor: "divider" }}
            >
              {d}
            </Box>
          ))}
        </Box>
        {Array.from({ length: 6 }, (_, w) => (
          <Box key={w} role="row" sx={{ display: "contents" }}>
            {grid.slice(w * 7, w * 7 + 7).map((day, i) => {
              const events = byDay.get(day) ?? [];
              const extra = events.length - MONTH_LIMIT;
              const isToday = day === today;
              const inMonth = day.slice(0, 7) === month;
              return (
                <Box
                  key={day}
                  role="gridcell"
                  aria-label={`${formatDay(day, { weekday: "long", day: "numeric", month: "long" })}${events.length ? `, ${events.length} item${events.length === 1 ? "" : "s"}` : ""}`}
                  sx={{
                    minHeight: 112,
                    p: 0.5,
                    borderBottom: w < 5 ? 1 : 0,
                    borderRight: i < 6 ? 1 : 0,
                    borderColor: "divider",
                    bgcolor: inMonth ? "transparent" : "var(--fill-track)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.25,
                    minWidth: 0,
                  }}
                >
                  <ButtonBase
                    href={dayHref(day)}
                    aria-label={`Open the week of ${formatDay(day, { day: "numeric", month: "long" })}`}
                    sx={{
                      alignSelf: "flex-start",
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      fontSize: 12,
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? "primary.contrastText" : inMonth ? "text.primary" : "text.muted",
                      bgcolor: isToday ? "primary.main" : "transparent",
                      "&:hover": { bgcolor: isToday ? "primary.dark" : "action.hover" },
                    }}
                  >
                    {Number(day.slice(8))}
                  </ButtonBase>
                  {events.slice(0, extra > 0 ? MONTH_LIMIT - 1 : MONTH_LIMIT).map((e) => (
                    <EventChip key={e.id} event={e} today={today} onOpen={onOpen} />
                  ))}
                  {extra > 0 && (
                    <ButtonBase
                      onClick={(ev: MouseEvent<HTMLButtonElement>) => onMore(day, ev.currentTarget)}
                      aria-label={`Show all ${events.length} items on ${formatDay(day, { day: "numeric", month: "long" })}`}
                      sx={{ alignSelf: "flex-start", px: 0.75, borderRadius: 0.75, fontSize: 12, fontWeight: 600, color: "text.secondary", "&:hover": { bgcolor: "action.hover" } }}
                    >
                      +{extra + 1} more
                    </ButtonBase>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

function WeekView({ date, today, byDay, onOpen }: { date: string; today: string; byDay: Map<string, CalendarEvent[]>; onOpen: OpenEvent }) {
  const days = weekDays(date);
  const placedByDay = days.map((day) => layoutDay((byDay.get(day) ?? []).filter((e) => !e.allDay), day, { startMinute: 0, endMinute: 24 * 60 }));
  // Widen the visible hours when something falls outside the working day.
  const all = placedByDay.flat();
  const startMinute = Math.min(DAY_WINDOW.startMinute, ...all.map((p) => Math.floor(p.top / 60) * 60));
  const endMinute = Math.max(DAY_WINDOW.endMinute, ...all.map((p) => Math.ceil((p.top + p.height) / 60) * 60));
  const window = { startMinute, endMinute };
  const hours = Array.from({ length: (endMinute - startMinute) / 60 }, (_, i) => startMinute / 60 + i);
  const hasAllDay = days.some((d) => (byDay.get(d) ?? []).some((e) => e.allDay));

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "52px repeat(7, minmax(0, 1fr))" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }} />
        {days.map((day, i) => {
          const isToday = day === today;
          return (
            <Box key={day} sx={{ py: 1, textAlign: "center", borderBottom: 1, borderLeft: 1, borderColor: "divider" }}>
              <Typography sx={{ fontSize: 12, color: "text.muted" }}>{WEEKDAYS[i]}</Typography>
              <Typography
                aria-current={isToday ? "date" : undefined}
                sx={{
                  mx: "auto",
                  width: 30,
                  height: 30,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  fontSize: 15,
                  fontWeight: isToday ? 700 : 500,
                  bgcolor: isToday ? "primary.main" : "transparent",
                  color: isToday ? "primary.contrastText" : "text.primary",
                }}
              >
                {Number(day.slice(8))}
              </Typography>
            </Box>
          );
        })}

        {hasAllDay && (
          <>
            <Box sx={{ px: 0.5, py: 0.75, fontSize: 11, color: "text.muted", textAlign: "right", borderBottom: 1, borderColor: "divider" }}>All day</Box>
            {days.map((day) => (
              <Stack key={day} spacing={0.25} sx={{ p: 0.5, minWidth: 0, borderBottom: 1, borderLeft: 1, borderColor: "divider" }}>
                {(byDay.get(day) ?? [])
                  .filter((e) => e.allDay)
                  .map((e) => (
                    <EventChip key={e.id} event={e} today={today} onOpen={onOpen} compact />
                  ))}
              </Stack>
            ))}
          </>
        )}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "52px repeat(7, minmax(0, 1fr))", maxHeight: 640, overflowY: "auto" }}>
        <Box sx={{ position: "relative", height: (endMinute - startMinute) * PX_PER_MINUTE }}>
          {hours.map((h, i) => (
            <Typography
              key={h}
              aria-hidden
              sx={{ position: "absolute", top: i * 60 * PX_PER_MINUTE - 7, right: 6, fontSize: 11, color: "text.muted", fontVariantNumeric: "tabular-nums" }}
            >
              {i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
            </Typography>
          ))}
        </Box>
        {days.map((day) => (
          <Box
            key={day}
            role="list"
            aria-label={formatDay(day, { weekday: "long", day: "numeric", month: "long" })}
            sx={{
              position: "relative",
              height: (endMinute - startMinute) * PX_PER_MINUTE,
              borderLeft: 1,
              borderColor: "divider",
              bgcolor: day === today ? "color-mix(in srgb, var(--color-accent) 4%, transparent)" : "transparent",
              backgroundImage: `repeating-linear-gradient(to bottom, var(--color-border) 0 1px, transparent 1px ${60 * PX_PER_MINUTE}px)`,
            }}
          >
            {layoutDay((byDay.get(day) ?? []).filter((e) => !e.allDay), day, window).map((p) => {
              const color = eventColor(p.event, today);
              const short = p.height * PX_PER_MINUTE < 36;
              return (
                <ButtonBase
                  key={p.event.id}
                  role="listitem"
                  onClick={(ev: MouseEvent<HTMLButtonElement>) => onOpen(p.event, ev.currentTarget)}
                  aria-label={label(p.event)}
                  sx={{
                    position: "absolute",
                    top: p.top * PX_PER_MINUTE + 1,
                    height: Math.max(p.height * PX_PER_MINUTE - 2, 18),
                    left: `calc(${(p.column / p.columns) * 100}% + 2px)`,
                    width: `calc(${100 / p.columns}% - 4px)`,
                    flexDirection: short ? "row" : "column",
                    alignItems: short ? "center" : "flex-start",
                    justifyContent: "flex-start",
                    gap: short ? 0.5 : 0,
                    overflow: "hidden",
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.75,
                    borderLeft: 3,
                    borderColor: color,
                    bgcolor: `color-mix(in srgb, ${color} 14%, var(--color-card, transparent))`,
                    textAlign: "left",
                    fontSize: 12,
                    lineHeight: 1.3,
                    textDecoration: p.event.status === "cancelled" ? "line-through" : undefined,
                    "&:hover": { bgcolor: `color-mix(in srgb, ${color} 22%, var(--color-card, transparent))` },
                    "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.main", outlineOffset: 1 },
                  }}
                >
                  <Box component="span" sx={{ order: short ? 1 : 0, minWidth: 0, fontWeight: 600, width: short ? undefined : "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.event.title}
                  </Box>
                  <Box component="span" sx={{ flexShrink: 0, color: "text.muted", fontVariantNumeric: "tabular-nums" }}>
                    {formatTime(p.event.start)}
                    {short ? "" : `–${formatTime(p.event.end)}`}
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

function AgendaView({ byDay, today, onOpen, empty }: { byDay: Map<string, CalendarEvent[]>; today: string; onOpen: OpenEvent; empty: ReactNode }) {
  const days = [...byDay.keys()].sort();
  if (!days.length) return <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>{empty}</Paper>;
  return (
    <Stack spacing={2}>
      {days.map((day) => (
        <Box key={day} component="section" aria-label={formatDay(day, { weekday: "long", day: "numeric", month: "long" })}>
          <Typography
            component="h3"
            sx={{ mb: 0.75, fontSize: 13, fontWeight: 600, color: day === today ? "primary.main" : "text.secondary" }}
          >
            {day === today ? "Today · " : ""}
            {formatDay(day, { weekday: "long", day: "numeric", month: "long" })}
          </Typography>
          <Paper variant="outlined" component="ul" sx={{ m: 0, p: 0, listStyle: "none", overflow: "hidden" }}>
            {byDay.get(day)!.map((e, i) => {
              const color = eventColor(e, today);
              const { Icon } = KIND_META[e.kind];
              const { first, last } = eventDays(e);
              return (
                <Box component="li" key={e.id} sx={{ borderTop: i ? 1 : 0, borderColor: "divider" }}>
                  <ButtonBase
                    onClick={(ev: MouseEvent<HTMLButtonElement>) => onOpen(e, ev.currentTarget)}
                    aria-label={label(e)}
                    sx={{ width: "100%", justifyContent: "flex-start", alignItems: "center", gap: 1.5, px: 2, py: 1.25, textAlign: "left", "&:hover": { bgcolor: "action.hover" } }}
                  >
                    <Box sx={{ width: 56, flexShrink: 0, fontSize: 13, color: "text.muted", fontVariantNumeric: "tabular-nums" }}>
                      {!e.allDay ? formatTime(e.start) : first === last ? "All day" : first < day ? "Ongoing" : "Starts"}
                    </Box>
                    <Box
                      aria-hidden
                      sx={{ display: "grid", placeItems: "center", width: 28, height: 28, flexShrink: 0, borderRadius: 1, color, bgcolor: `color-mix(in srgb, ${color} 12%, transparent)` }}
                    >
                      <Icon sx={{ fontSize: 15 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: e.status === "cancelled" ? "line-through" : undefined }}
                      >
                        {e.title}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "text.muted", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {KIND_META[e.kind].label}
                        {e.context ? ` · ${e.context}` : ""}
                      </Typography>
                    </Box>
                    <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 0.5 }}>
                      {isOverdue(e, today) ? <StatusBadge status="overdue" /> : e.status ? <StatusBadge status={e.status} /> : null}
                    </Box>
                  </ButtonBase>
                </Box>
              );
            })}
          </Paper>
        </Box>
      ))}
    </Stack>
  );
}

/**
 * The calendar: month, week and agenda views over everything dated in the
 * portal, a filter by kind, and MUI's DateCalendar to jump to a date. The
 * view and date live in the address (`?view=week&date=2026-10-16`), so the
 * server loads exactly the events the view shows and links can be shared.
 * Below the tablet breakpoint every view becomes the agenda list.
 */
export function CalendarView({
  view,
  date,
  today,
  events,
  basePath,
}: {
  view: View;
  date: string;
  today: string;
  events: CalendarEvent[];
  basePath: string;
}) {
  const router = useRouter();
  const [hidden, setHidden] = useState<Set<CalendarEventKind>>(() => new Set());
  const [selected, setSelected] = useState<{ event: CalendarEvent; anchor: HTMLElement } | null>(null);
  const [more, setMore] = useState<{ day: string; anchor: HTMLElement } | null>(null);

  const href = (v: View, d: string) => `${basePath}?view=${v}&date=${d}`;
  const range = viewRange(view, date);
  const visible = useMemo(() => events.filter((e) => !hidden.has(e.kind)), [events, hidden]);
  const byDay = useMemo(() => groupByDay(visible, range.from, range.to), [visible, range.from, range.to]);
  const monthByDay = useMemo(() => groupByDay(visible, range.from, range.to, { repeatSpansWeekly: true }), [visible, range.from, range.to]);
  // Dots in the small calendar: every day something touches, spans included.
  const busyDays = useMemo(() => {
    const days = new Set<string>();
    for (const e of visible) {
      const { first, last } = eventDays(e);
      for (const d of eachDay(first < range.from ? range.from : first, last > range.to ? range.to : last)) days.add(d);
    }
    return days;
  }, [visible, range.from, range.to]);
  const counts = useMemo(() => {
    const c = new Map<CalendarEventKind, number>();
    for (const e of events) c.set(e.kind, (c.get(e.kind) ?? 0) + 1);
    return c;
  }, [events]);

  const open: OpenEvent = (event, anchor) => {
    setMore(null);
    setSelected({ event, anchor });
  };
  const toggle = (kind: CalendarEventKind) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });

  const empty = (
    <Typography sx={{ fontSize: 14, color: "text.muted" }}>
      {events.length ? "Everything in this range is filtered out." : "Nothing scheduled in this range."}
    </Typography>
  );
  const agenda = <AgendaView byDay={byDay} today={today} onOpen={open} empty={empty} />;

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1fr) 300px" }, gap: 3, alignItems: "start" }}>
      <Stack spacing={2} sx={{ minWidth: 0 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
          <Button href={href(view, today)} variant="outlined" color="secondary" size="small">
            Today
          </Button>
          <Box sx={{ display: "flex" }}>
            <IconButton href={href(view, stepDate(view, date, -1))} aria-label={`Previous ${view === "agenda" ? "four weeks" : view}`} size="small">
              <ArrowBack sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton href={href(view, stepDate(view, date, 1))} aria-label={`Next ${view === "agenda" ? "four weeks" : view}`} size="small">
              <NavigateNext sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
          <Typography component="h2" aria-live="polite" sx={{ fontSize: 18, fontWeight: 600, mr: "auto" }}>
            {viewTitle(view, date)}
          </Typography>
          <ToggleButtonGroup value={view} exclusive size="small" aria-label="Calendar view" sx={{ display: { xs: "none", md: "inline-flex" } }}>
            {(["month", "week", "agenda"] as const).map((v) => (
              <ToggleButton
                key={v}
                value={v}
                href={href(v, date)}
                aria-label={`${v} view`}
                sx={{ px: 1.5, textTransform: "none", fontSize: 13, color: "text.secondary", "&.Mui-selected": { color: "text.primary" } }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {counts.size > 0 && (
          <Box role="group" aria-label="Show or hide kinds of items" sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {KIND_ORDER.filter((k) => counts.has(k)).map((k) => {
              const { plural, Icon } = KIND_META[k];
              const on = !hidden.has(k);
              return (
                <Chip
                  key={k}
                  icon={<Icon />}
                  label={`${plural} · ${counts.get(k)}`}
                  onClick={() => toggle(k)}
                  aria-pressed={on}
                  variant={on ? "filled" : "outlined"}
                  size="small"
                  sx={{ textDecoration: on ? undefined : "line-through", color: on ? undefined : "text.muted" }}
                />
              );
            })}
          </Box>
        )}

        {view === "agenda" ? (
          agenda
        ) : (
          <>
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              {view === "month" ? (
                <MonthView
                  date={date}
                  today={today}
                  byDay={monthByDay}
                  onOpen={open}
                  onMore={(day, anchor) => setMore({ day, anchor })}
                  dayHref={(d) => href("week", d)}
                />
              ) : (
                <WeekView date={date} today={today} byDay={byDay} onOpen={open} />
              )}
            </Box>
            <Box sx={{ display: { xs: "block", md: "none" } }}>{agenda}</Box>
          </>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ display: { xs: "none", lg: "block" }, p: 1, position: "sticky", top: 88 }}>
        <MiniCalendar value={date} today={today} busyDays={busyDays} onChange={(d) => router.push(href(view, d))} />
      </Paper>

      <Popover
        open={Boolean(more)}
        anchorEl={more?.anchor}
        onClose={() => setMore(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { width: 260, p: 1.5 }, role: "dialog", "aria-label": more ? `Everything on ${formatDay(more.day)}` : undefined } }}
      >
        {more && (
          <Stack spacing={0.5}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>{formatDay(more.day, { weekday: "long", day: "numeric", month: "long" })}</Typography>
            {(monthByDay.get(more.day) ?? []).map((e) => (
              <EventChip key={e.id} event={e} today={today} onOpen={(event) => open(event, more.anchor)} />
            ))}
          </Stack>
        )}
      </Popover>

      <EventPopover event={selected?.event ?? null} anchorEl={selected?.anchor ?? null} today={today} onClose={() => setSelected(null)} />
    </Box>
  );
}
