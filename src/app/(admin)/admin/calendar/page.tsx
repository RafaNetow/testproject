import Stack from "@mui/material/Stack";
import { createClient } from "@/lib/supabase/server";
import { SectionHeader } from "@/components/shared/section-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import { loadCalendarEvents } from "@/lib/calendar-events";
import { CALENDAR_VIEWS, dayKey, isDayKey, viewRange, type CalendarView as View } from "@/lib/calendar";

/** Today in the studio's zone; kept out of the component body so render stays pure. */
function todayKey() {
  return dayKey(new Date());
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string }> }) {
  const params = await searchParams;
  const today = todayKey();
  const view: View = CALENDAR_VIEWS.includes(params.view as View) ? (params.view as View) : "month";
  const date = isDayKey(params.date) ? params.date : today;

  const supabase = await createClient();
  const events = await loadCalendarEvents(supabase, { ...viewRange(view, date), surface: "admin" });

  return (
    <Stack spacing={3}>
      <SectionHeader title="Calendar" subtitle="Meetings, due dates and project stages across every client. Times are Copenhagen time." />
      <CalendarView view={view} date={date} today={today} events={events} basePath="/admin/calendar" />
    </Stack>
  );
}
