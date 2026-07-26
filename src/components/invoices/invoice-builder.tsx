"use client";

import { useState, useTransition } from "react";
import { Clock, Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import {
  createInvoiceWithLineItems,
  type InvoiceLineItem,
  type VatTreatment,
} from "@/lib/actions/invoices";
import { InvoicePreview } from "./invoice-preview";

const inputClass =
  "rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent";

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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">New invoice</p>
        {duplicateFrom && (
          <p className="-mt-2 text-xs text-muted-foreground">
            Pre-filled from that invoice — give it a new number and due date before sending.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Invoice #</label>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-0001"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClass}
            >
              <option value="DKK">DKK</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Issued</label>
            <input
              type="date"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {availableHours.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-secondary">
              <Clock size={14} />
              Import billable hours
            </p>
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
              {availableHours.map((h) => (
                <label key={h.id} className="flex items-center gap-2 text-sm text-primary">
                  <input
                    type="checkbox"
                    checked={selectedHourIds.has(h.id)}
                    onChange={() => toggleHourSelection(h.id)}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(h.entry_date).toLocaleDateString("en-GB")}
                  </span>
                  <span>{h.hours}h</span>
                  <span className="truncate text-muted-foreground">
                    {h.category}
                    {h.description ? ` — ${h.description}` : ""}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-secondary">Rate / hour</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                  className={`${inputClass} w-28`}
                />
              </div>
              <button
                type="button"
                disabled={!selectedHourIds.size}
                onClick={importSelectedHours}
                className="rounded-full border border-border px-3.5 py-2 text-xs font-medium text-secondary transition-colors hover:bg-muted disabled:opacity-40"
              >
                Add {selectedHourIds.size || ""} to invoice
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-secondary">Line items</label>
          {lineItems.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <input
                value={item.description}
                onChange={(e) => updateItem(i, { description: e.target.value })}
                placeholder="Description"
                className={`${inputClass} min-w-0 flex-1`}
              />
              <input
                type="number"
                min={0}
                value={item.quantity}
                onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 0 })}
                className={`${inputClass} w-16 text-right`}
                title="Quantity"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={item.unitPriceCents / 100}
                onChange={(e) =>
                  updateItem(i, { unitPriceCents: Math.round(Number(e.target.value) * 100) || 0 })
                }
                className={`${inputClass} w-24 text-right`}
                title="Unit price"
              />
              <button
                type="button"
                onClick={() => removeItem(i)}
                disabled={lineItems.length === 1}
                aria-label={`Remove line item ${i + 1}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
              >
                <Trash size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-muted"
          >
            <Plus size={13} weight="bold" />
            Add line
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-secondary">VAT treatment</label>
          <select
            value={vatTreatment}
            onChange={(e) => changeVatTreatment(e.target.value as VatTreatment)}
            className={inputClass}
          >
            {VAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {vatTreatment === "eu_reverse_charge" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">
              Buyer&apos;s VAT number (required for reverse charge)
            </label>
            <input
              value={buyerVatNumber}
              onChange={(e) => setBuyerVatNumber(e.target.value)}
              placeholder="e.g. DE123456789"
              className={inputClass}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">VAT %</label>
            <input
              type="number"
              min={0}
              step="0.1"
              value={taxRatePct}
              disabled={vatTreatment !== "domestic"}
              onChange={(e) => setTaxRatePct(Number(e.target.value) || 0)}
              className={`${inputClass} disabled:opacity-50`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Discount</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={discountCents / 100}
              onChange={(e) => setDiscountCents(Math.round(Number(e.target.value) * 100) || 0)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => submit("draft")}
            className="rounded-full border border-primary px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
          >
            Save as draft
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => submit("sent")}
            className="btn-primary rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Send invoice"}
          </button>
        </div>

        {message && (
          <p
            role="status"
            className={`text-sm leading-relaxed ${
              message.success ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>

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
    </div>
  );
}
