import type { SelectHTMLAttributes } from "react";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";

/** A native <select> with the browser's default chrome hidden and a custom chevron drawn in its place. */
export function SelectField({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full appearance-none rounded-lg border border-border bg-background px-3.5 py-2.5 pr-9 text-sm text-primary outline-none transition-colors focus:border-accent ${className ?? ""}`}
      >
        {children}
      </select>
      <CaretDown
        size={12}
        weight="bold"
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
