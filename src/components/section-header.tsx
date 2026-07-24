type SectionHeaderProps = {
  index: string;
  label: string;
  title: string;
  dark?: boolean;
  className?: string;
};

/**
 * The page's shared "dossier" header device — a numbered index, a mono
 * label, and a hairline rule running to the margin, with the display
 * heading beneath. Used identically in every numbered section so the
 * whole page reads as one designed document rather than stacked blocks.
 */
export function SectionHeader({
  index,
  label,
  title,
  dark = false,
  className,
}: SectionHeaderProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-accent">{index}</span>
        <span
          className={`font-mono text-xs uppercase tracking-[0.25em] ${
            dark ? "text-white/50" : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
        <span
          aria-hidden="true"
          className={`h-px flex-1 ${dark ? "bg-white/15" : "bg-border"}`}
        />
      </div>
      <h2
        className={`mt-6 max-w-3xl text-balance font-display text-4xl font-medium leading-[1.08] sm:text-5xl ${
          dark ? "text-white" : "text-primary"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}
