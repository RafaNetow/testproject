import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ConfirmButton } from "@/components/confirm-button";
import { AutoSubmitSelect } from "@/components/board/auto-submit-select";
import { StatusBadge } from "@/components/shared/status-badge";
import { figureSx } from "@/lib/palette";
import { updateInvoiceStatus, deleteInvoice } from "@/lib/actions/invoices";
import { deriveInvoiceStatus } from "@/lib/invoice-status";
import { InvoiceBuilder, type DuplicateFrom, type UnbilledHoursEntry } from "./invoice-builder";
import { InvoicePreview, type PreviewLineItem, type VatTreatment } from "./invoice-preview";
import { AttachFile, ContentCopy, DeleteOutlined, Download, ExpandMore } from "@/components/icons";

type Invoice = {
  id: string;
  invoice_number: string;
  amount_cents: number;
  currency: string;
  status: string;
  due_date: string | null;
  issued_at: string | null;
  line_items: PreviewLineItem[] | null;
  vat_treatment: VatTreatment | null;
  tax_rate_pct: number | null;
  buyer_vat_number: string | null;
  discount_cents: number | null;
  pdf_storage_path: string | null;
  url: string | null;
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

const iconSx = { color: "text.muted", "&:hover": { color: "primary.main" } } as const;

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(cents / 100);
}

export function InvoicesView({
  orgId,
  orgName,
  orgCvrNumber,
  projectId,
  invoices,
  unbilledHours,
  revalidatePaths,
  canManage,
  basePath,
  duplicateFrom,
}: {
  orgId: string;
  orgName: string;
  orgCvrNumber?: string | null;
  projectId: string;
  invoices: Invoice[];
  unbilledHours: UnbilledHoursEntry[];
  revalidatePaths: string[];
  canManage: boolean;
  basePath?: string;
  duplicateFrom?: (DuplicateFrom & { sourceId: string }) | null;
}) {
  return (
    <Stack spacing={3}>
      {canManage && (
        <InvoiceBuilder
          key={duplicateFrom?.sourceId ?? "new"}
          orgId={orgId}
          projectId={projectId}
          orgName={orgName}
          orgCvrNumber={orgCvrNumber}
          unbilledHours={unbilledHours}
          revalidatePaths={revalidatePaths}
          duplicateFrom={duplicateFrom ?? undefined}
        />
      )}

      {!invoices.length ? (
        <Typography sx={{ fontSize: 14, color: "text.muted" }}>No invoices yet.</Typography>
      ) : (
        <Stack spacing={1.5} className="stagger">
          {invoices.map((inv) => {
            const updateThis = updateInvoiceStatus.bind(null, inv.id, revalidatePaths);
            const deleteThis = deleteInvoice.bind(null, inv.id, inv.pdf_storage_path, revalidatePaths);
            const displayStatus = deriveInvoiceStatus(inv.status, inv.due_date);
            return (
              <Paper key={inv.id} variant="outlined" sx={{ overflow: "hidden" }}>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                    px: 2.5,
                    py: 2,
                  }}
                >
                  <div>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{inv.invoice_number}</Typography>
                      <StatusBadge status={displayStatus} />
                    </Box>
                    <Typography sx={{ mt: 0.5, fontSize: 14, color: "text.muted" }}>
                      <Box component="span" sx={{ ...figureSx, color: "text.primary", fontWeight: 600 }}>
                        {formatAmount(inv.amount_cents, inv.currency)}
                      </Box>
                      {inv.due_date ? ` · Due ${new Date(inv.due_date).toLocaleDateString("en-GB")}` : ""}
                    </Typography>
                  </div>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconButton
                      component="a"
                      href={`/invoices/${inv.id}/print`}
                      target="_blank"
                      rel="noreferrer"
                      size="small"
                      title="Download PDF"
                      aria-label={`Download invoice ${inv.invoice_number} as PDF`}
                      sx={iconSx}
                    >
                      <Download sx={{ fontSize: 18 }} />
                    </IconButton>
                    {inv.url && (
                      <IconButton
                        component="a"
                        href={inv.url}
                        size="small"
                        title="Download attached PDF"
                        aria-label={`Download invoice ${inv.invoice_number} attached PDF`}
                        sx={iconSx}
                      >
                        <AttachFile sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}
                    {canManage && basePath && (
                      <IconButton
                       
                        href={`${basePath}?duplicate=${inv.id}`}
                        size="small"
                        title="Duplicate"
                        aria-label={`Duplicate invoice ${inv.invoice_number}`}
                        sx={iconSx}
                      >
                        <ContentCopy sx={{ fontSize: 17 }} />
                      </IconButton>
                    )}
                    {canManage && (
                      <>
                        <Box component="form" action={updateThis} sx={{ ml: 0.5 }}>
                          <AutoSubmitSelect
                            name="status"
                            defaultValue={inv.status}
                            options={STATUS_OPTIONS}
                            ariaLabel={`Status of invoice ${inv.invoice_number}`}
                          />
                        </Box>
                        <form action={deleteThis}>
                          <ConfirmButton
                            confirmText={`Delete invoice ${inv.invoice_number}? This can't be undone.`}
                            ariaLabel={`Delete invoice ${inv.invoice_number}`}
                            icon={<DeleteOutlined sx={{ fontSize: 18 }} />}
                          />
                        </form>
                      </>
                    )}
                  </Box>
                </Box>
                <Accordion
                  disableGutters
                  elevation={0}
                  sx={{ borderTop: 1, borderColor: "divider", bgcolor: "transparent", "&::before": { display: "none" } }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore sx={{ fontSize: 18 }} />}
                    sx={{ px: 2.5, minHeight: 40, "& .MuiAccordionSummary-content": { my: 1 } }}
                  >
                    <Typography sx={{ fontSize: 12, fontWeight: 500, color: "text.muted" }}>View invoice</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ borderTop: 1, borderColor: "divider", p: 2 }}>
                    <InvoicePreview
                      orgName={orgName}
                      orgCvrNumber={orgCvrNumber}
                      invoiceNumber={inv.invoice_number}
                      issuedAt={inv.issued_at}
                      dueDate={inv.due_date}
                      currency={inv.currency}
                      lineItems={inv.line_items ?? []}
                      vatTreatment={inv.vat_treatment ?? "domestic"}
                      taxRatePct={inv.tax_rate_pct ?? 0}
                      buyerVatNumber={inv.buyer_vat_number}
                      discountCents={inv.discount_cents ?? 0}
                      status={displayStatus}
                    />
                  </AccordionDetails>
                </Accordion>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
