"use client";

import type { ReactNode, MouseEvent } from "react";

/** A submit button that gates the form's submission behind a native confirm(). */
export function ConfirmButton({
  confirmText,
  children,
  className,
  ariaLabel,
}: {
  confirmText: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  function onClick(e: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmText)) {
      e.preventDefault();
    }
  }

  return (
    <button
      type="submit"
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
