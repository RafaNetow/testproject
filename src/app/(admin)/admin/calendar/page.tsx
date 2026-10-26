import { createClient } from "@/lib/supabase/server";
import { AdminCalendar } from "@/components/calendar/admin-calendar";
import { dayKey } from "@/lib/calendar";

/** Today in the studio's zone; kept out of the component body so render stays pure. */
function todayKey() {
  return dayKey(new Date());
}

export default async function CalendarPage() {
  const supabase = await createClient();
  // Projects a client meeting can be scheduled on, as "Client · Project".
  const { data } = await supabase
    .from("projects")
    .select("id, name, status, organizations(name)")
    .neq("status", "completed")
    .order("name");
  const projects = ((data ?? []) as unknown as { id: string; name: string; organizations: { name: string } | null }[]).map((p) => ({
    id: p.id,
    label: `${p.organizations?.name ?? "—"} · ${p.name}`,
  }));

  return <AdminCalendar projects={projects} today={todayKey()} />;
}
