type SectionHeaderProps = {
  title: string;
  dark?: boolean;
  className?: string;
};

/**
 * The page's shared section heading. The heading carries the section on its
 * own — no numbered index or kicker label above it.
 */
export function SectionHeader({ title, dark = false, className }: SectionHeaderProps) {
  return (
    <div className={className}>
      <h2
        className={`max-w-3xl text-balance font-display text-4xl font-medium leading-[1.08] sm:text-5xl ${
          dark ? "text-white" : "text-primary"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}
