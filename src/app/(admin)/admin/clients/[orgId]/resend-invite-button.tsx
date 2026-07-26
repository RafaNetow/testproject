"use client";

import { useState, useTransition } from "react";
import { PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { resendInvite } from "./actions";

export function ResendInviteButton({ orgId, email }: { orgId: string; email: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ emailSent: boolean; message?: string } | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const res = await resendInvite(orgId, email);
      setResult(res);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {result && (
        <p
          className={`text-xs ${
            result.emailSent
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-amber-700 dark:text-amber-400"
          }`}
        >
          {result.emailSent ? "Sent" : result.message}
        </p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        title="Resend invite"
        aria-label={`Resend invite to ${email}`}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-accent disabled:opacity-60"
      >
        <PaperPlaneTilt size={15} />
      </button>
    </div>
  );
}
