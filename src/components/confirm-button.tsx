"use client";

import type { ReactNode, MouseEvent } from "react";

/** A submit button that gates the form's submission behind a native confirm(). */
export function ConfirmButton({
  confirmText,
  children,
  className,
}: {
  confirmText: string;
  children: ReactNode;
  className?: string;
}) {
  function onClick(e: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmText)) {
      e.preventDefault();
    }
  }

  return (
    <button type="submit" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
