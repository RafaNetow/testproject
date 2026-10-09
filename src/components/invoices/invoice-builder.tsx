"use client";

import { useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import Add from "@mui/icons-material/Add";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { SelectField } from "@/components/shared/select-field";
import {
  createInvoiceWithLineItems,
  type InvoiceLineItem,
  type VatTreatment,
} from "@/lib/actions/invoices";
import { InvoicePreview } from "./invoice-preview";

const VAT_OPTIONS: { value: VatTreatment; label: string }[] = [
  { value: "domestic", label: "Danish domestic (25% moms)" },
  { value: "eu_reverse_charge", label: "EU business — reverse charge (0%)" },
  { value: "outside_eu", label: "Outside EU — no VAT (0%)" },
];

export type UnbilledHoursEntry = {
  id: string;
  entry_date: string;
  hours: number;
  category: string | null;
  description: string | null;
};

export type DuplicateFrom = {
  currency: string;
  lineItems: InvoiceLineItem[];
  vatTreatment: VatTreatment;
  taxRatePct: number;
  buyerVatNumber: string | null;
  discountCents: number;
};

export function InvoiceBuilder({
  orgId,
  projectId,
  orgName,
  orgCvrNumber,
  unbilledHours,
  revalidatePaths,
  duplicateFrom,
}: {
  orgId: string;
  projectId: string;
  orgName: string;
  orgCvrNumber?: string | null;
  unbilledHours: UnbilledHoursEntry[];
  revalidatePaths: string[];
  duplicateFrom?: DuplicateFrom;
}) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [currency, setCurrency] = useState(duplicateFrom?.currency ?? "DKK");
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [vatTreatment, setVatTreatment] = useState<VatTreatment>(
    duplicateFrom?.vatTreatment ?? "domestic"
  );
  const [taxRatePct, setTaxRatePct] = useState(duplicateFrom?.taxRatePct ?? 25);
  const [buyerVatNumber, setBuyerVatNumber] = useState(duplicateFrom?.buyerVatNumber ?? "");
  const [discountCents, setDiscountCents] = useState(duplicateFrom?.discountCents ?? 0);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    duplicateFrom?.lineItems.length
      ? duplicateFrom.lineItems
      : [{ description: "", quantity: 1, unitPriceCents: 0 }]
  );
  const [selectedHourIds, setSelectedHourIds] = useState<Set<string>>(new Set());
  const [importedHourIds, setImportedHourIds] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function changeVatTreatment(next: VatTreatment) {
    setVatTreatment(next);
    setTaxRatePct(next === "domestic" ? 25 : 0);
  }

  function toggleHourSelection(id: string) {
    setSelectedHourIds((ids) => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function importSelectedHours() {
    const selected = unbilledHours.filter((h) => selectedHourIds.has(h.id));
    if (!selected.length) return;

    const imported: InvoiceLineItem[] = selected.map((h) => ({
      description: `${new Date(h.entry_date).toLocaleDateString("en-GB")} — ${
        h.category ?? "Hours"
      }${h.description ? `: ${h.description}` : ""}`,
      quantity: h.hours,
      unitPriceCents: Math.round(hourlyRate * 100),
    }));

    setLineItems((items) => {
      const withoutBlank = items.filter((it) => it.description.trim() || it.quantity !== 1 || it.unitPriceCents !== 0);
      return [...withoutBlank, ...imported];
    });
    setImportedHourIds((ids) => [...ids, ...selected.map((h) => h.id)]);
    setSelectedHourIds(new Set());
  }

  function updateItem(i: number, patch: Partial<InvoiceLineItem>) {
    setLineItems((items) => items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setLineItems((items) => [...items, { description: "", quantity: 1, unitPriceCents: 0 }]);
  }
  function removeItem(i: number) {
    setLineItems((items) => items.filter((_, idx) => idx !== i));
  }

  function submit(status: "draft" | "sent") {
    startTransition(async () => {
      const result = await createInvoiceWithLineItems(orgId, projectId, revalidatePaths, {
        invoiceNumber,
        currency,
        issuedAt,
        dueDate,
        lineItems,
        vatTreatment,
        taxRatePct,
        buyerVatNumber,
        discountCents,
        status,
        importedHoursEntryIds: importedHourIds,
      });
      setMessage({ success: result.success, text: result.message ?? "" });
      if (result.success) {
        setInvoiceNumber("");
        setDueDate("");
        changeVatTreatment("domestic");
        setBuyerVatNumber("");
        setDiscountCents(0);
        setLineItems([{ description: "", quantity: 1, unitPriceCents: 0 }]);
        setImportedHourIds([]);
        setSelectedHourIds(new Set());
      }
    });
  }

  const availableHours = unbilledHours.filter((h) => !importedHourIds.includes(h.id));

  return (
    <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" } }}>
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <div>
            <Typography variant="h2" sx={{ fontSize: 18 }}>
              New invoice
            </Typography>
            {duplicateFrom && (
              <Typography sx={{ mt: 0.5, fontSize: 12, color: "text.muted" }}>
                Pre-filled from that invoice — give it a new number and due date before sending.
              </Typography>
            )}
          </div>

          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(2, 1fr)" }}>
            <TextField label="Invoice #" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-0001" />
            <SelectField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="DKK">DKK</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </SelectField>
            <TextField
              label="Issued"
              type="date"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Due date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          {availableHours.length > 0 && (
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
              <Typography sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 14, fontWeight: 500, color: "text.secondary" }}>
                <AccessTimeOutlined sx={{ fontSize: 16 }} />
                Import billable hours
              </Typography>
              <Box sx={{ mt: 0.5, display: "flex", maxHeight: 160, flexDirection: "column", overflowY: "auto" }}>
                {availableHours.map((h) => (
                  <FormControlLabel
                    key={h.id}
                    control={<Checkbox size="small" checked={selectedHourIds.has(h.id)} onChange={() => toggleHourSelection(h.id)} />}
                    label={
                      <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 14, minWidth: 0 }}>
                        <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "text.muted" }}>
                          {new Date(h.entry_date).toLocaleDateString("en-GB")}
                        </Box>
                        <span>{h.hours}h</span>
                        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "text.muted" }}>
                          {h.category}
                          {h.description ? ` — ${h.description}` : ""}
                        </Box>
                      </Box>
                    }
                    sx={{ mr: 0 }}
                  />
                ))}
              </Box>
              <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
                <TextField
                  label="Rate / hour"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                  slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                  fullWidth={false}
                  sx={{ width: 130 }}
                />
                <Button variant="outlined" color="secondary" size="small" disabled={!selectedHourIds.size} onClick={importSelectedHours}>
                  Add {selectedHourIds.size || ""} to invoice
                </Button>
              </Box>
            </Paper>
          )}

          <Stack spacing={1}>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary" }}>Line items</Typography>
            {lineItems.map((item, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                  value={item.description}
                  onChange={(e) => updateItem(i, { description: e.target.value })}
                  placeholder="Description"
                  slotProps={{ htmlInput: { "aria-label": `Line ${i + 1} description` } }}
                  sx={{ flex: 1, minWidth: 0 }}
                />
                <TextField
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 0 })}
                  title="Quantity"
                  slotProps={{ htmlInput: { min: 0, "aria-label": `Line ${i + 1} quantity`, style: { textAlign: "right" } } }}
                  fullWidth={false}
                  sx={{ width: 76 }}
                />
                <TextField
                  type="number"
                  value={item.unitPriceCents / 100}
                  onChange={(e) => updateItem(i, { unitPriceCents: Math.round(Number(e.target.value) * 100) || 0 })}
                  title="Unit price"
                  slotProps={{ htmlInput: { min: 0, step: 0.01, "aria-label": `Line ${i + 1} unit price`, style: { textAlign: "right" } } }}
                  fullWidth={false}
                  sx={{ width: 110 }}
                />
                <IconButton
                  size="small"
                  onClick={() => removeItem(i)}
                  disabled={lineItems.length === 1}
                  aria-label={`Remove line item ${i + 1}`}
                  sx={{ color: "text.muted", "&:hover": { color: "error.main" } }}
                >
                  <DeleteOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            ))}
            <Box>
              <Button variant="outlined" color="secondary" size="small" startIcon={<Add />} onClick={addItem}>
                Add line
              </Button>
            </Box>
          </Stack>

          <SelectField label="VAT treatment" value={vatTreatment} onChange={(e) => changeVatTreatment(e.target.value as VatTreatment)}>
            {VAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectField>

          {vatTreatment === "eu_reverse_charge" && (
            <TextField
              label="Buyer's VAT number (required for reverse charge)"
              value={buyerVatNumber}
              onChange={(e) => setBuyerVatNumber(e.target.value)}
              placeholder="e.g. DE123456789"
            />
          )}

          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(2, 1fr)" }}>
            <TextField
              label="VAT %"
              type="number"
              value={taxRatePct}
              disabled={vatTreatment !== "domestic"}
              onChange={(e) => setTaxRatePct(Number(e.target.value) || 0)}
              slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
            />
            <TextField
              label="Discount"
              type="number"
              value={discountCents / 100}
              onChange={(e) => setDiscountCents(Math.round(Number(e.target.value) * 100) || 0)}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
            <Button variant="outlined" color="navy" disabled={isPending} onClick={() => submit("draft")}>
              Save as draft
            </Button>
            <Button variant="contained" disabled={isPending} onClick={() => submit("sent")}>
              {isPending ? "Saving…" : "Send invoice"}
            </Button>
          </Box>

          {message && (
            <Alert role="status" variant="outlined" severity={message.success ? "success" : "error"}>
              {message.text}
            </Alert>
          )}
        </Stack>
      </Paper>

      <InvoicePreview
        orgName={orgName}
        orgCvrNumber={orgCvrNumber}
        invoiceNumber={invoiceNumber}
        issuedAt={issuedAt}
        dueDate={dueDate || null}
        currency={currency}
        lineItems={lineItems}
        vatTreatment={vatTreatment}
        taxRatePct={taxRatePct}
        buyerVatNumber={buyerVatNumber}
        discountCents={discountCents}
      />
    </Box>
  );
}
