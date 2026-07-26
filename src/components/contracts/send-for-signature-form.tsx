"use client";

import { useActionState } from "react";
import { PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import {
  sendContractForSignature,
  type SendForSignatureResult,
} from "@/lib/actions/contracts";

export function SendForSignatureForm({
  contractId,
  orgId,
  revalidatePaths,
}: {
  contractId: string;
  orgId: string;
  revalidatePaths: string[];
}) {
  const [state, formAction, isPending] = useActionState<
    SendForSignatureResult | null,
    FormData
  >(
    async (_prevState, formData) =>
      sendContractForSignature(contractId, orgId, revalidatePaths, _prevState, formData),
    null
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-[140px] flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-secondary">Signer name</label>
          <input
            name="recipient_name"
            required
            placeholder="Jane Doe"
            className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-primary outline-none transition-colors focus:border-accent"
          />
        </div>
        <div className="flex min-w-[160px] flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-secondary">Signer email</label>
          <input
            name="recipient_email"
            type="email"
            required
            placeholder="jane@client.com"
            className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-primary outline-none transition-colors focus:border-accent"
          />
        </div>
        <div className="flex min-w-[160px] flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-secondary">Unsigned PDF</label>
          <input
            name="pdf"
            type="file"
            accept="application/pdf"
            required
            className="rounded-md border border-border bg-card px-2 py-1 text-xs text-primary outline-none transition-colors file:mr-2 file:rounded-full file:border-0 file:bg-muted file:px-2 file:py-1 file:text-[11px] file:font-medium file:text-secondary focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium disabled:opacity-60"
        >
          <PaperPlaneTilt size={13} weight="bold" />
          {isPending ? "Sending…" : "Send for e-signature"}
        </button>
      </div>

      {state && (
        <p
          role="status"
          className={`text-xs leading-relaxed ${
            state.success ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
