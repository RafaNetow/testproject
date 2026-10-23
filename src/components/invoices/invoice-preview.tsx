import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { BUSINESS_INFO } from "@/lib/business-info";
import { formatMoney } from "@/lib/money";
import { computeInvoiceTotals, type PreviewLineItem, type VatTreatment } from "@/lib/invoice-totals";

export type { PreviewLineItem, VatTreatment };

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

const VAT_NOTES: Record<VatTreatment, string | null> = {
  domestic: null,
  eu_reverse_charge: "Reverse charge — Article 196, VAT Directive 2006/112/EC / Omvendt betalingspligt",
  outside_eu: "Outside the scope of VAT / Ydelse uden for EU",
};

const STATUS_LABELS: Record<string, string> = { paid: "Paid", overdue: "Overdue" };
const STATUS_COLORS: Record<string, string> = { paid: "success.main", overdue: "error.main" };

const metaLabel = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "text.muted",
} as const;

const numCell = { textAlign: "right", fontVariantNumeric: "tabular-nums" } as const;

export function InvoicePreview({
  orgName,
  orgCvrNumber,
  invoiceNumber,
  issuedAt,
  dueDate,
  currency,
  lineItems,
  taxRatePct,
  discountCents,
  vatTreatment,
  buyerVatNumber,
  status,
}: {
  orgName: string;
  orgCvrNumber?: string | null;
  invoiceNumber: string;
  issuedAt: string | null;
  dueDate: string | null;
  currency: string;
  lineItems: PreviewLineItem[];
  taxRatePct: number;
  discountCents: number;
  vatTreatment: VatTreatment;
  buyerVatNumber?: string | null;
  status?: string;
}) {
  const { subtotal, taxCents, total } = computeInvoiceTotals(lineItems, vatTreatment, taxRatePct, discountCents);
  const note = VAT_NOTES[vatTreatment];
  const statusLabel = status ? STATUS_LABELS[status] : undefined;

  const totalRow = (label: string, value: string) => (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5, color: "text.secondary" }}>
      <span>{label}</span>
      <Box component="span" sx={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </Box>
    </Box>
  );

  return (
    <Paper variant="outlined" className="invoice-document" sx={{ position: "relative", overflow: "hidden", boxShadow: 1 }}>
      <Box sx={{ height: 6, bgcolor: "primary.main" }} />

      <Box sx={{ p: { xs: 4, sm: 5 } }}>
        {statusLabel && (
          <Box
            sx={{
              position: "absolute",
              right: 32,
              top: 32,
              transform: "rotate(3deg)",
              borderRadius: 1,
              border: 2,
              borderColor: STATUS_COLORS[status!] ?? "divider",
              color: STATUS_COLORS[status!] ?? "text.muted",
              px: 1.5,
              py: 0.5,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            {statusLabel}
          </Box>
        )}

        {/* Letterhead */}
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 3 }}>
          <div>
            <Typography sx={{ fontFamily: "var(--font-display)", fontSize: 24, fontStyle: "italic" }}>
              {BUSINESS_INFO.name}
            </Typography>
            <Typography sx={{ mt: 0.75, fontSize: 14, color: "text.muted" }}>{BUSINESS_INFO.email}</Typography>
            {BUSINESS_INFO.address && <Typography sx={{ fontSize: 14, color: "text.muted" }}>{BUSINESS_INFO.address}</Typography>}
            {BUSINESS_INFO.cvrNumber && (
              <Typography sx={{ mt: 0.5, fontFamily: "var(--font-mono)", fontSize: 12, color: "text.muted" }}>
                VAT {BUSINESS_INFO.cvrNumber}
              </Typography>
            )}
          </div>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h2" sx={{ fontSize: 36, lineHeight: 1 }}>
              Invoice
            </Typography>
            <Typography sx={{ mt: 1, fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.2em", color: "primary.main" }}>
              #{invoiceNumber || "—"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mt: 4 }} />

        {/* Billed to + dates */}
        <Box sx={{ mt: 4, display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 3 }}>
          <div>
            <Typography sx={metaLabel}>Billed to</Typography>
            <Typography sx={{ mt: 0.75, fontSize: 16, fontWeight: 500 }}>{orgName}</Typography>
            {vatTreatment === "domestic" && orgCvrNumber && (
              <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "text.muted" }}>CVR {orgCvrNumber}</Typography>
            )}
            {vatTreatment === "eu_reverse_charge" && buyerVatNumber && (
              <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "text.muted" }}>VAT {buyerVatNumber}</Typography>
            )}
          </div>
          <Box sx={{ display: "flex", gap: 4, textAlign: "right" }}>
            <div>
              <Typography sx={metaLabel}>Issued</Typography>
              <Typography sx={{ mt: 0.75, fontSize: 14 }}>{formatDate(issuedAt)}</Typography>
            </div>
            <div>
              <Typography sx={metaLabel}>Due</Typography>
              <Typography sx={{ mt: 0.75, fontSize: 14 }}>{formatDate(dueDate)}</Typography>
            </div>
          </Box>
        </Box>

        {/* Line items */}
        <Table size="small" sx={{ mt: 5, "& td, & th": { px: 1, fontSize: 14 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={metaLabel}>Description</TableCell>
              <TableCell sx={{ ...metaLabel, ...numCell, width: 56 }}>Qty</TableCell>
              <TableCell sx={{ ...metaLabel, ...numCell, width: 110 }}>Rate</TableCell>
              <TableCell sx={{ ...metaLabel, ...numCell, width: 110 }}>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!lineItems.length ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ py: 3, color: "text.muted" }}>
                  No line items yet.
                </TableCell>
              </TableRow>
            ) : (
              lineItems.map((li, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ py: 1.75 }}>{li.description || "—"}</TableCell>
                  <TableCell sx={{ ...numCell, color: "text.secondary" }}>{li.quantity}</TableCell>
                  <TableCell sx={{ ...numCell, color: "text.secondary" }}>{formatMoney(li.unitPriceCents, currency)}</TableCell>
                  <TableCell sx={{ ...numCell, fontWeight: 500 }}>{formatMoney(li.quantity * li.unitPriceCents, currency)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Totals */}
        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Box sx={{ width: "100%", maxWidth: 260, fontSize: 14 }}>
            {totalRow("Subtotal", formatMoney(subtotal, currency))}
            {vatTreatment === "domestic" && taxRatePct > 0 && totalRow(`VAT (${taxRatePct}%)`, formatMoney(taxCents, currency))}
            {vatTreatment !== "domestic" && totalRow("VAT", formatMoney(0, currency))}
            {discountCents > 0 && totalRow("Discount", `-${formatMoney(discountCents, currency)}`)}
            <Box
              sx={{
                mt: 0.5,
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                borderRadius: 2,
                bgcolor: "var(--color-muted)",
                px: 1.5,
                py: 1.25,
              }}
            >
              <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: "text.secondary" }}>
                Total
              </Typography>
              <Typography sx={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                {formatMoney(total, currency)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 5, borderTop: 1, borderColor: "divider", pt: 3 }}>
          <Typography sx={{ fontFamily: "var(--font-display)", fontSize: 14, fontStyle: "italic", color: "text.secondary" }}>
            Thank you for the opportunity to work together.
          </Typography>
          {note && <Typography sx={{ mt: 1, fontFamily: "var(--font-mono)", fontSize: 10, color: "text.muted" }}>{note}</Typography>}
        </Box>
      </Box>
    </Paper>
  );
}
