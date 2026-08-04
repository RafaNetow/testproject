import { Plus } from "@phosphor-icons/react/dist/ssr";
import { SelectField } from "@/components/shared/select-field";
import { logHours, updateHoursEntry, deleteHoursEntry } from "@/lib/actions/hours";
import { EditableHoursRow } from "./editable-hours-row";

type HoursEntry = {
  id: string;
  entry_date: string;
  hours: number;
  category: string | null;
  description: string | null;
  billable: boolean;
  invoice_id: string | null;
};

const CATEGORIES = [
  "Analysis",
  "Formulation work",
  "Meeting",
  "Report writing",
  "Other",
];

export function HoursView({
  projectId,
  entries,
  revalidatePaths,
  canLog,
}: {
  projectId: string;
  entries: HoursEntry[];
  revalidatePaths: string[];
  canLog: boolean;
}) {
  const logForThisProject = logHours.bind(null, projectId, revalidatePaths);

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
  const billableHours = entries
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + Number(e.hours), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-secondary">Total hours logged</p>
          <p className="mt-2 font-display text-3xl font-medium text-primary">
            {totalHours.toFixed(1)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-secondary">Billable hours</p>
          <p className="mt-2 font-display text-3xl font-medium text-primary">
            {billableHours.toFixed(1)}
          </p>
        </div>
      </div>

      {canLog && (
        <form
          action={logForThisProject}
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="entry-date" className="text-sm font-medium text-secondary">
              Date
            </label>
            <input
              id="entry-date"
              name="entry_date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex w-24 flex-col gap-1.5">
            <label htmlFor="entry-hours" className="text-sm font-medium text-secondary">
              Hours
            </label>
            <input
              id="entry-hours"
              name="hours"
              type="number"
              min={0}
              step="0.25"
              required
              placeholder="1.5"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="entry-category" className="text-sm font-medium text-secondary">
              Category
            </label>
            <SelectField id="entry-category" name="category" defaultValue={CATEGORIES[0]}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <label htmlFor="entry-description" className="text-sm font-medium text-secondary">
              Description (optional)
            </label>
            <input
              id="entry-description"
              name="description"
              placeholder="What you worked on"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <label className="flex items-center gap-2 pb-2.5 text-sm text-secondary">
            <input
              type="checkbox"
              name="billable"
              defaultChecked
              className="h-4 w-4 rounded border-border accent-accent"
            />
            Billable
          </label>
          <button
            type="submit"
            className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
          >
            <Plus size={16} weight="bold" />
            Log time
          </button>
        </form>
      )}

      {!entries.length ? (
        <p className="text-sm text-muted-foreground">No hours logged yet.</p>
      ) : (
        <div className="divide-y divide-border border-t border-border">
          {entries.map((e) => {
            const updateThis = canLog ? updateHoursEntry.bind(null, e.id, revalidatePaths) : undefined;
            const deleteThis = canLog ? deleteHoursEntry.bind(null, e.id, revalidatePaths) : undefined;
            return (
              <EditableHoursRow
                key={e.id}
                entry={e}
                updateAction={updateThis}
                deleteAction={deleteThis}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
