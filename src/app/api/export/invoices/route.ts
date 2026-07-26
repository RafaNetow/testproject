import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { deriveInvoiceStatus } from "@/lib/invoice-status";
import { toCsv } from "@/lib/csv";

export async function GET() {
  await requireAxelAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("invoices")
    .select(
      "invoice_number, amount_cents, currency, status, due_date, issued_at, organizations(name)"
    )
    .order("issued_at", { ascending: false });

  const rows = (data ?? []).map((inv) => {
    const orgName = (inv.organizations as unknown as { name: string } | null)?.name ?? "";
    return [
      orgName,
      inv.invoice_number,
      deriveInvoiceStatus(inv.status, inv.due_date),
      inv.currency,
      (inv.amount_cents / 100).toFixed(2),
      inv.issued_at ?? "",
      inv.due_date ?? "",
    ];
  });

  const csv = toCsv(
    ["Client", "Invoice #", "Status", "Currency", "Amount", "Issued", "Due"],
    rows
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoices-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
