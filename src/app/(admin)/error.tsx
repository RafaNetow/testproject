"use client";

import { useEffect } from "react";
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";

export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-destructive">Error</p>
      <h1 className="font-display text-xl font-medium text-primary">
        Something went wrong.
      </h1>
      <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground">
        {error.message || "The action couldn't be completed. Try again."}
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="btn-primary mt-2 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
      >
        <ArrowCounterClockwise size={16} weight="bold" />
        Try again
      </button>
    </div>
  );
}
