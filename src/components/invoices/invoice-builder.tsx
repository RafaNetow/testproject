"use client";

import { useState, useTransition } from "react";
import { Plus, Trash } from "@phosphor-icons/react/dist/ssr";
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

export function InvoiceBuilder({
  orgId,
  projectId,
  orgName,
  orgCvrNumber,
  revalidatePaths,
}: {
  orgId: string;
  projectId: string;
  orgName: string;
  orgCvrNumber?: string | null;
  revalidatePaths: string[];
}) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [currency, setCurrency] = useState("DKK");
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [vatTreatment, setVatTreatment] = useState<VatTreatment>("domestic");
  const [taxRatePct, setTaxRatePct] = useState(25);
  const [buyerVatNumber, setBuyerVatNumber] = useState("");
  const [discountCents, setDiscountCents] = useState(0);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: "", quantity: 1, unitPriceCents: 0 },
  ]);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function changeVatTreatment(next: VatTreatment) {
    setVatTreatment(next);
    setTaxRatePct(next === "domestic" ? 25 : 0);
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
      });
      setMessage({ success: result.success, text: result.message ?? "" });
      if (result.success) {
        setInvoiceNumber("");
        setDueDate("");
        changeVatTreatment("domestic");
        setBuyerVatNumber("");
        setDiscountCents(0);
        setLineItems([{ description: "", quantity: 1, unitPriceCents: 0 }]);
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">New invoice</p>

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
              message.success ? "text-emerald-700" : "text-destructive"
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
