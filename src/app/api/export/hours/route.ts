import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

export async function GET() {
  await requireAxelAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("hours_entries")
    .select(
      "entry_date, hours, category, description, billable, invoice_id, projects(name, organizations(name))"
    )
    .order("entry_date", { ascending: false });

  const rows = (data ?? []).map((h) => {
    const project = h.projects as unknown as { name: string; organizations: { name: string } | null } | null;
    return [
      project?.organizations?.name ?? "",
      project?.name ?? "",
      h.entry_date,
      h.hours,
      h.category ?? "",
      h.description ?? "",
      h.billable ? "Yes" : "No",
      h.invoice_id ? "Yes" : "No",
    ];
  });

  const csv = toCsv(
    ["Client", "Project", "Date", "Hours", "Category", "Description", "Billable", "Invoiced"],
    rows
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hours-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
