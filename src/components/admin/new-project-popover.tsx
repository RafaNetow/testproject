"use client";

import { Plus } from "@phosphor-icons/react/dist/ssr";
import { Popover } from "@/components/shared/popover";

const fieldInputClass =
  "rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent";

export function NewProjectPopover({
  createAction,
}: {
  createAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <Popover
      align="right"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
        >
          <Plus size={15} weight="bold" />
          New project
        </button>
      )}
    >
      {(close) => (
        <form
          action={createAction}
          onSubmit={close}
          className="flex w-80 flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-name" className="text-sm font-medium text-secondary">
              Project name
            </label>
            <input
              id="project-name"
              name="name"
              required
              placeholder="Coating formulation review"
              className={fieldInputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-start" className="text-sm font-medium text-secondary">
              Start date
            </label>
            <input id="project-start" name="start_date" type="date" className={fieldInputClass} />
          </div>
          <button
            type="submit"
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium"
          >
            Create project
          </button>
        </form>
      )}
    </Popover>
  );
}
