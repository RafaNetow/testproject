"use client";

import { useState } from "react";
import { PencilSimple, Trash, X } from "@phosphor-icons/react/dist/ssr";
import { ConfirmButton } from "@/components/confirm-button";
import { SelectField } from "@/components/shared/select-field";
import { StatusBadge } from "@/components/shared/status-badge";

const CATEGORIES = ["Analysis", "Formulation work", "Meeting", "Report writing", "Other"];

type HoursEntry = {
  id: string;
  entry_date: string;
  hours: number;
  category: string | null;
  description: string | null;
  billable: boolean;
  invoice_id: string | null;
};

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none transition-colors focus:border-accent";

export function EditableHoursRow({
  entry,
  updateAction,
  deleteAction,
}: {
  entry: HoursEntry;
  updateAction?: (formData: FormData) => void;
  deleteAction?: (formData: FormData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const canManage = Boolean(updateAction && deleteAction);

  if (editing && updateAction) {
    return (
      <form
        action={(formData) => {
          updateAction(formData);
          setEditing(false);
        }}
        className="flex flex-wrap items-end gap-3 py-3.5"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-secondary">Date</label>
          <input
            name="entry_date"
            type="date"
            required
            defaultValue={entry.entry_date}
            className={inputClass}
          />
        </div>
        <div className="flex w-20 flex-col gap-1.5">
          <label className="text-xs font-medium text-secondary">Hours</label>
          <input
            name="hours"
            type="number"
            min={0}
            step="0.25"
            required
            defaultValue={entry.hours}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-secondary">Category</label>
          <SelectField name="category" defaultValue={entry.category ?? CATEGORIES[0]}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-secondary">Description</label>
          <input name="description" defaultValue={entry.description ?? ""} className={inputClass} />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-secondary">
          <input
            type="checkbox"
            name="billable"
            defaultChecked={entry.billable}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          Billable
        </label>
        <button type="submit" className="btn-primary rounded-full px-4 py-2 text-xs font-medium">
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          aria-label="Cancel editing"
        >
          <X size={15} />
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(entry.entry_date).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
        </span>
        <span className="text-sm font-medium text-primary">{Number(entry.hours).toFixed(2)}h</span>
        {entry.category && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {entry.category}
          </span>
        )}
        {!entry.billable && (
          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
            Non-billable
          </span>
        )}
        {entry.invoice_id && <StatusBadge status="paid" label="Invoiced" />}
        {entry.description && <span className="text-sm text-secondary">{entry.description}</span>}
      </div>
      {canManage && (
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
            aria-label={`Edit ${entry.hours} hour entry`}
          >
            <PencilSimple size={15} />
          </button>
          <form action={deleteAction}>
            <ConfirmButton
              confirmText={`Delete this ${entry.hours}h entry?`}
              ariaLabel={`Delete ${entry.hours} hour entry`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash size={15} />
            </ConfirmButton>
          </form>
        </div>
      )}
    </div>
  );
}
