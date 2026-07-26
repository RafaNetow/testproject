"use client";

import { CaretDown } from "@phosphor-icons/react/dist/ssr";

/** A select whose parent form submits itself on change — no separate button needed. */
export function AutoSubmitSelect({
  name,
  defaultValue,
  options,
  className,
}: {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className="relative">
      <select
        name={name}
        defaultValue={defaultValue}
        className={`appearance-none pr-6 ${className ?? ""}`}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <CaretDown
        size={10}
        weight="bold"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
