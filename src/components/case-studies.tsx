import { Reveal } from "@/components/reveal";
import { HorizontalScroller } from "@/components/horizontal-scroller";
import { SpotlightCard } from "@/components/spotlight-card";

const SCENARIOS = [
  {
    tag: "Bio-based adhesive",
    story:
      "Bond strength dropped after humidity exposure. FTIR and DSC traced it to a migrating plasticiser, not a cure failure — redirecting the fix to a crosslinker swap and saving weeks.",
  },
  {
    tag: "Industrial polymer blend",
    story:
      "A blend that worked at lab scale turned brittle after pilot-line scale-up. TGA pointed to a narrower processing window than assumed — a scoped adjustment restored ductility with no reformulation.",
  },
  {
    tag: "Water-resistant coating",
    story:
      "Water resistance varied unpredictably between formulation variants. NMR isolated an unreacted monomer fraction behind the weaker batches — pointing straight to a revised cure schedule as the next experiment.",
  },
];

export function CaseStudies() {
  return (
    <section id="work" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
            Representative scenarios
          </p>
          <h2 className="mt-4 text-balance font-display text-4xl font-medium leading-tight text-primary sm:text-5xl">
            The kind of problem we&apos;re usually called in for.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Illustrative examples based on common failure patterns — not
            attributed to a specific client.
          </p>
        </Reveal>
      </div>

      <Reveal className="mt-16">
        <HorizontalScroller className="scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-4 lg:px-10">
          {SCENARIOS.map((s) => (
            <SpotlightCard
              key={s.tag}
              className="flex w-[85vw] shrink-0 snap-start flex-col gap-5 rounded-2xl border border-border bg-card p-8 sm:w-[420px]"
            >
              <span className="font-mono text-xs uppercase tracking-widest text-accent">
                {s.tag}
              </span>
              <p className="text-[15px] leading-relaxed text-secondary">
                {s.story}
              </p>
            </SpotlightCard>
          ))}
          <div aria-hidden="true" className="w-px shrink-0" />
        </HorizontalScroller>
      </Reveal>
    </section>
  );
}
