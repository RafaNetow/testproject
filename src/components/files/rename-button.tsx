"use client";

import { useRef } from "react";
import { PencilSimple } from "@phosphor-icons/react/dist/ssr";

/**
 * A hidden-input + prompt() pair that submits its parent <form> with the new
 * name — mirrors the existing window.confirm() pattern used by ConfirmButton,
 * rather than introducing a whole new inline-edit UI just for this.
 */
export function RenameButton({
  fieldName,
  currentValue,
  promptText,
  ariaLabel,
  className,
}: {
  fieldName: string;
  currentValue: string;
  promptText: string;
  ariaLabel: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function onClick() {
    const next = window.prompt(promptText, currentValue);
    if (!next || !next.trim() || next.trim() === currentValue) return;
    if (inputRef.current) {
      inputRef.current.value = next.trim();
      inputRef.current.form?.requestSubmit();
    }
  }

  return (
    <>
      <input ref={inputRef} type="hidden" name={fieldName} />
      <button type="button" onClick={onClick} aria-label={ariaLabel} className={className}>
        <PencilSimple size={14} />
      </button>
    </>
  );
}
