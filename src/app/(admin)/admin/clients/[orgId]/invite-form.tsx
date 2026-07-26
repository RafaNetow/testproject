"use client";

import { useActionState } from "react";
import { PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { inviteMember, type InviteResult } from "./actions";

export function InviteForm({ orgId }: { orgId: string }) {
  const [state, formAction, isPending] = useActionState<InviteResult | null, FormData>(
    async (_prevState, formData) => inviteMember(orgId, formData),
    null
  );

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-secondary">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="client@company.com"
            className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium text-secondary">
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue="owner"
            className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
          >
            <option value="owner">Owner</option>
            <option value="collaborator">Collaborator</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          <PaperPlaneTilt size={16} weight="bold" />
          {isPending ? "Sending…" : "Send invite"}
        </button>
      </div>

      {state && (
        <p
          role="status"
          className={`text-sm leading-relaxed ${
            !state.success
              ? "text-destructive"
              : state.emailSent
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-amber-700 dark:text-amber-400"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
