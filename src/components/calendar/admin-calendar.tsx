"use client";

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import FullCalendar from "@fullcalendar/react";
import type { DateSelectArg, DatesSetArg, EventApi, EventClickArg, EventContentArg, EventDropArg, EventSourceFuncArg } from "@fullcalendar/core";
import enGb from "@fullcalendar/core/locales/en-gb";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type EventResizeDoneArg } from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { Dayjs } from "dayjs";
import "dayjs/locale/en-gb";
import Alert from "@mui/material/Alert";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  Add,
  ArrowBack,
  Close,
  NavigateNext,
  Replay,
  ViewAgendaOutlined,
  ViewDayOutlined,
  ViewMonthOutlined,
  ViewWeekOutlined,
} from "@/components/icons";
import { SectionHeader } from "@/components/shared/section-header";
import { notifySuccess } from "@/components/shared/success-toast";
import { getCalendarRange, moveCalendarItem } from "@/lib/actions/calendar";
import { addDays, formatDay, formatTime, type CalendarEvent, type CalendarEventKind } from "@/lib/calendar";
import { EVENT_COLORS, KIND_COLOR, floatingDay, floatingLocal, timeState, toFloating, toFullCalendar, type EventColor } from "@/lib/calendar-floating";
import { KIND_META, KIND_ORDER, isOverdue } from "./event-kinds";
import { EventPopover } from "./event-popover";
import { CalendarEventDialog, type DialogDraft } from "./calendar-event-dialog";

const VIEWS = [
  { key: "dayGridMonth", label: "Month", Icon: ViewMonthOutlined },
  { key: "timeGridWeek", label: "Week", Icon: ViewWeekOutlined },
  { key: "timeGridDay", label: "Day", Icon: ViewDayOutlined },
  { key: "listWeek", label: "Agenda", Icon: ViewAgendaOutlined },
] as const;
type ViewKey = (typeof VIEWS)[number]["key"];

const noSubscribe = () => () => {};

// A clock that ticks each minute, so past / "Now" / upcoming styling stays current on an open page.
const everyMinute = (onTick: () => void) => {
  const id = window.setInterval(onTick, 60_000);
  return () => window.clearInterval(id);
};
const currentMinute = () => Math.floor(Date.now() / 60_000);

/**
 * The admin calendar, after the Minimal dashboard's: Month / Week / Day /
 * Agenda, Today and arrows, a Filters drawer, "New event", click or drag
 * across days to add, click to edit, drag to move and stretch to resize.
 * Everything is in Copenhagen time. Meetings and due dates move for real
 * (people are notified); stages and invoices stay put.
 */
export function AdminCalendar({ projects, today }: { projects: { id: string; label: string }[]; today: string }) {
  const ref = useRef<FullCalendar>(null);
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);
  const minute = useSyncExternalStore(everyMinute, currentMinute, () => 0);
  // Copenhagen "now" for the grid, renewed each minute. Each event is tagged
  // is-past / is-now / is-future from it (FullCalendar's own past/future
  // classes only compare whole days in month and agenda views).
  // (The server snapshot is 0, but the calendar only renders once mounted.)
  const nowFloating = toFloating(new Date(minute * 60_000).toISOString());
  const now = useCallback(() => nowFloating, [nowFloating]);
  const stateClass = useCallback(
    ({ event }: EventContentArg) => (event.start ? [`is-${timeState(event.start, event.end, event.allDay, nowFloating)}`] : []),
    [nowFloating]
  );
  const [view, setView] = useState<ViewKey>("dayGridMonth");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState<Set<CalendarEventKind>>(() => new Set());
  const [items, setItems] = useState<CalendarEvent[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [range, setRange] = useState<{ from: Dayjs | null; to: Dayjs | null }>({ from: null, to: null });
  const [draft, setDraft] = useState<DialogDraft | null>(null);
  const [popover, setPopover] = useState<{ event: CalendarEvent; anchor: HTMLElement } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const api = () => ref.current?.getApi();

  // Phones start in the agenda list, as on Minimal. The calendar only renders once mounted, so window is there.
  const wide = !mounted || window.matchMedia("(min-width: 768px)").matches;
  const startView: ViewKey = wide ? "dayGridMonth" : "listWeek";

  const fetchEvents = useCallback(
    (info: EventSourceFuncArg, success: (events: ReturnType<typeof toFullCalendar>[]) => void, failure: (e: Error) => void) => {
      const from = floatingDay(info.start);
      const to = addDays(floatingDay(info.end), -1);
      getCalendarRange(from, to)
        .then((list) => {
          setItems(list);
          success(list.filter((e) => !hidden.has(e.kind)).map((e) => toFullCalendar(e, isOverdue(e, today))));
        })
        .catch((e: unknown) => failure(e instanceof Error ? e : new Error("Couldn't load the calendar")));
    },
    [hidden, today]
  );

  const refetch = () => api()?.refetchEvents();

  function openCreate(start: string, end: string, allDay: boolean) {
    setDraft({ type: "event", title: "", description: "", allDay, start, end, color: "primary", projectId: "", zoomUrl: "" });
  }

  function onSelect(info: DateSelectArg) {
    api()?.unselect();
    if (info.allDay) openCreate(floatingDay(info.start), addDays(floatingDay(info.end), -1), true);
    else openCreate(floatingLocal(info.start), floatingLocal(info.end), false);
  }

  function onEventClick(info: EventClickArg) {
    info.jsEvent.preventDefault();
    const item = info.event.extendedProps.item as CalendarEvent;
    if (item.kind === "event") {
      setDraft({
        id: item.id,
        type: "event",
        title: item.title,
        description: item.description ?? "",
        allDay: item.allDay,
        start: item.allDay ? item.start : toFloating(item.start).slice(0, 16),
        end: item.allDay ? item.end : toFloating(item.end).slice(0, 16),
        color: (item.color as EventColor) ?? "primary",
        projectId: "",
        zoomUrl: "",
      });
    } else if (item.kind === "meeting" && item.status !== "cancelled") {
      setDraft({
        id: item.id,
        type: "meeting",
        title: item.title,
        description: item.meeting?.notes ?? "",
        allDay: false,
        start: toFloating(item.start).slice(0, 16),
        end: toFloating(item.end).slice(0, 16),
        color: "primary",
        projectId: item.meeting?.projectId ?? "",
        zoomUrl: item.meeting?.zoomUrl ?? "",
        context: item.context,
      });
    } else {
      setPopover({ event: item, anchor: info.el });
    }
  }

  async function onMove(info: EventDropArg | EventResizeDoneArg) {
    const ev: EventApi = info.event;
    const item = ev.extendedProps.item as CalendarEvent;
    const allDay = ev.allDay;
    const start = allDay ? floatingDay(ev.start!) : floatingLocal(ev.start!);
    const end = allDay
      ? ev.end
        ? addDays(floatingDay(ev.end), -1)
        : start
      : floatingLocal(ev.end ?? new Date(ev.start!.getTime() + 60 * 60000));
    const result = await moveCalendarItem(item.id, { start, end, allDay });
    if (!result.ok) {
      info.revert();
      setError(result.message);
      return;
    }
    const day = allDay ? formatDay(start) : `${formatDay(start.slice(0, 10))} ${start.slice(11)}`;
    notifySuccess(`Moved "${item.title}" to ${day}`);
    refetch();
  }

  const filtersActive = hidden.size > 0 || Boolean(range.from || range.to);
  const listed = useMemo(() => {
    const from = range.from?.format("YYYY-MM-DD");
    const to = range.to?.format("YYYY-MM-DD");
    return items
      .filter((e) => !hidden.has(e.kind))
      .filter((e) => {
        const day = e.allDay ? e.start : e.start.slice(0, 10);
        return (!from || day >= from) && (!to || day <= to);
      })
      .sort((a, b) => (a.start < b.start ? -1 : 1));
  }, [items, hidden, range]);
  const kindsPresent = KIND_ORDER.filter((k) => items.some((e) => e.kind === k) || k === "event");

  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Calendar"
        subtitle="Meetings, due dates, stages and your own events across every client. Times are Copenhagen time."
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              const start = `${today}T09:00`;
              openCreate(start, `${today}T10:00`, false);
            }}
          >
            Add event
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ overflow: "hidden", position: "relative" }}>
        {/* Toolbar, as on Minimal: view · ‹ title › · Today · Filters */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: { xs: 1.5, sm: 2.5 }, py: 2, flexWrap: "wrap" }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={view}
            onChange={(_, v: ViewKey | null) => v && api()?.changeView(v)}
            aria-label="Calendar view"
            sx={{
              // Minimal: icon-only buttons in a thin outlined box; the current view on a grey fill.
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              p: 0.5,
              gap: 0.5,
              "& .MuiToggleButton-root": {
                border: 0,
                borderRadius: "8px !important",
                width: 36,
                height: 36,
                p: 0,
                color: "text.secondary",
              },
              "& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover": {
                bgcolor: "var(--fill-neutral)",
                color: "text.primary",
              },
            }}
          >
            {VIEWS.map((v) => (
              <Tooltip key={v.key} title={v.label}>
                <ToggleButton value={v.key} aria-label={v.label}>
                  <v.Icon sx={{ fontSize: 20 }} />
                </ToggleButton>
              </Tooltip>
            ))}
          </ToggleButtonGroup>

          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, minWidth: 220 }}>
            <IconButton aria-label="Previous" onClick={() => api()?.prev()} size="small">
              <ArrowBack sx={{ fontSize: 18 }} />
            </IconButton>
            <Typography component="h2" aria-live="polite" sx={{ fontSize: 18, fontWeight: 700, minWidth: 180, textAlign: "center" }}>
              {title}
            </Typography>
            <IconButton aria-label="Next" onClick={() => api()?.next()} size="small">
              <NavigateNext sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Soft button in the Settings accent. */}
          <Button
            size="small"
            onClick={() => api()?.today()}
            sx={{
              fontWeight: 700,
              // Deeper in light mode, lighter in dark (mixes toward the text colour).
              color: "color-mix(in srgb, var(--color-accent) 75%, var(--color-primary))",
              bgcolor: "color-mix(in srgb, var(--color-accent) 14%, transparent)",
              "&:hover": { bgcolor: "color-mix(in srgb, var(--color-accent) 24%, transparent)" },
            }}
          >
            Today
          </Button>
          <Tooltip title="Filters">
            <IconButton aria-label="Filters" onClick={() => setFiltersOpen(true)}>
              <Badge color="error" variant="dot" invisible={!filtersActive}>
                <Box component="span" sx={{ display: "inline-flex" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden>
                    <path d="M4 6h16M7 12h10M10 18h4" />
                  </svg>
                </Box>
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
        {loading && <LinearProgress sx={{ position: "absolute", left: 0, right: 0, top: 0, height: 2 }} />}

        {/* Styled in globals.css (.mcal): FullCalendar's own CSS sits outside MUI's layer. */}
        <Box className="mcal" sx={{ px: { xs: 0, sm: 1 }, pb: 1 }}>
          {mounted && (
            <FullCalendar
              ref={ref}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView={startView}
              headerToolbar={false}
              locale={enGb}
              timeZone="UTC"
              now={now}
              eventClassNames={stateClass}
              firstDay={1}
              height={view.startsWith("timeGrid") ? 760 : "auto"}
              dayMaxEventRows={3}
              nowIndicator
              selectable
              selectMirror
              editable
              eventResizableFromStart
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              scrollTime="08:00:00"
              allDayText="All day"
              eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
              slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
              events={fetchEvents}
              loading={setLoading}
              datesSet={(arg: DatesSetArg) => {
                setTitle(arg.view.title);
                setView(arg.view.type as ViewKey);
              }}
              select={onSelect}
              eventClick={onEventClick}
              eventDrop={onMove}
              eventResize={onMove}
              eventAllow={(drop, dragged) => {
                const item = dragged?.extendedProps.item as CalendarEvent | undefined;
                // Own events may switch between all-day and timed; meetings stay timed, due dates stay whole days.
                return item?.kind === "event" || drop.allDay === dragged?.allDay;
              }}
            />
          )}
        </Box>
      </Paper>

      <Drawer anchor="right" open={filtersOpen} onClose={() => setFiltersOpen(false)} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 340 } } } }}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 2 }}>
            <Typography sx={{ flex: 1, fontSize: 17, fontWeight: 700 }}>Filters</Typography>
            <Tooltip title="Reset">
              <IconButton aria-label="Reset filters" onClick={() => { setHidden(new Set()); setRange({ from: null, to: null }); }}>
                <Badge color="error" variant="dot" invisible={!filtersActive}>
                  <Replay sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>
            </Tooltip>
            <IconButton aria-label="Close filters" onClick={() => setFiltersOpen(false)}>
              <Close sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
          <Divider />
          <Box sx={{ px: 2.5, py: 2.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>What to show</Typography>
            <Box role="group" aria-label="Kinds" sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {kindsPresent.map((k) => {
                const on = !hidden.has(k);
                const token = `var(${EVENT_COLORS[KIND_COLOR[k]]})`;
                return (
                  <ButtonBase
                    key={k}
                    aria-pressed={on}
                    onClick={() =>
                      setHidden((prev) => {
                        const next = new Set(prev);
                        if (next.has(k)) next.delete(k);
                        else next.add(k);
                        return next;
                      })
                    }
                    sx={{
                      gap: 0.75,
                      px: 1.25,
                      py: 0.75,
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                      border: 1,
                      borderColor: on ? token : "var(--border-outline)",
                      color: on ? "text.primary" : "text.muted",
                      textDecoration: on ? "none" : "line-through",
                    }}
                  >
                    <Box component="span" aria-hidden sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: token, opacity: on ? 1 : 0.4 }} />
                    {KIND_META[k].plural}
                  </ButtonBase>
                );
              })}
            </Box>
          </Box>
          <Divider />
          <Box sx={{ px: 2.5, py: 2.5, display: "grid", gap: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Range</Typography>
            <DatePicker label="From" value={range.from} onChange={(v) => setRange((r) => ({ ...r, from: v }))} format="D MMM YYYY" slotProps={{ field: { clearable: true } }} />
            <DatePicker label="To" value={range.to} onChange={(v) => setRange((r) => ({ ...r, to: v }))} minDate={range.from ?? undefined} format="D MMM YYYY" slotProps={{ field: { clearable: true } }} />
          </Box>
          <Divider />
          <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
              Events <Box component="span" sx={{ color: "text.muted", fontWeight: 500 }}>({listed.length})</Box>
            </Typography>
          </Box>
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, pb: 2, overflowY: "auto" }}>
            {listed.map((e) => {
              const token = `var(${EVENT_COLORS[(e.color as EventColor) ?? KIND_COLOR[e.kind]]})`;
              const day = e.allDay ? e.start : toFloating(e.start).slice(0, 10);
              return (
                <Box component="li" key={e.id}>
                  <ButtonBase
                    onClick={() => {
                      api()?.gotoDate(day);
                      setFiltersOpen(false);
                    }}
                    sx={{ width: "100%", justifyContent: "flex-start", textAlign: "left", gap: 1.5, px: 2.5, py: 1.25, "&:hover": { bgcolor: "action.hover" } }}
                  >
                    <Box aria-hidden sx={{ width: 4, alignSelf: "stretch", borderRadius: 2, bgcolor: token, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12, color: "text.muted" }}>
                        {formatDay(day)}
                        {e.allDay ? "" : ` · ${formatTime(e.start)}`}
                      </Typography>
                      <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
                        {e.title}
                      </Typography>
                    </Box>
                  </ButtonBase>
                </Box>
              );
            })}
          </Box>
        </LocalizationProvider>
      </Drawer>

      <CalendarEventDialog draft={draft} projects={projects} onClose={() => setDraft(null)} onChanged={refetch} />
      <EventPopover event={popover?.event ?? null} anchorEl={popover?.anchor ?? null} today={today} onClose={() => setPopover(null)} />
      <Snackbar open={Boolean(error)} autoHideDuration={5000} onClose={() => setError(null)} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
        <Alert severity="error" variant="filled" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
