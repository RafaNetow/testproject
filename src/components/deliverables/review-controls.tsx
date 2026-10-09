"use client";

import { useActionState } from "react";
import { CheckCircle, CircleNotch, PencilSimpleLine } from "@phosphor-icons/react/dist/ssr";
import { reviewDeliverable, type ReviewState } from "@/lib/actions/deliverables";

/**
 * The client owner's response to a deliverable: approve it, or send it back
 * with a note. Errors (a missing note, a deliverable that was already
 * reviewed) are shown inline instead of crashing the page.
 */
export function ReviewControls({ deliverableId, title }: { deliverableId: string; title: string }) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(
    reviewDeliverable.bind(null, deliverableId),
    null
  );

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
      <label htmlFor={`note-${deliverableId}`} className="text-sm font-medium text-secondary">
        Your note <span className="font-normal text-muted-foreground">(required to request changes)</span>
      </label>
      <textarea
        id={`note-${deliverableId}`}
        name="note"
        rows={3}
        maxLength={2000}
        defaultValue={state && !state.ok ? (state.note ?? "") : ""}
        placeholder="What should we change or clarify?"
        className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
      />

      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-secondary">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="decision"
          value="approved"
          disabled={pending}
          aria-label={`Approve "${title}"`}
          className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {pending ? <CircleNotch size={16} className="animate-spin" /> : <CheckCircle size={16} weight="bold" />}
          Approve
        </button>
        <button
          type="submit"
          name="decision"
          value="changes_requested"
          disabled={pending}
          aria-label={`Request changes to "${title}"`}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-muted disabled:opacity-60"
        >
          <PencilSimpleLine size={16} />
          Request changes
        </button>
      </div>
    </form>
  );
}
