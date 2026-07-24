import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/reveal";
import { SectionHeader } from "@/components/section-header";

const SCENARIOS = [
  {
    tag: "Bio-based adhesive",
    before: "Unexplained bond failures",
    after: "Clear root cause",
    story:
      "FTIR and DSC traced it to a migrating plasticiser, not a cure failure — redirecting the fix to a crosslinker swap and saving weeks.",
  },
  {
    tag: "Industrial polymer blend",
    before: "Brittle at scale",
    after: "Ductility restored",
    story:
      "TGA pointed to a narrower processing window than assumed — a scoped adjustment restored performance with no reformulation.",
  },
  {
    tag: "Water-resistant coating",
    before: "Inconsistent results",
    after: "Root cause identified",
    story:
      "NMR isolated an unreacted monomer fraction behind the weaker batches — pointing straight to a revised cure schedule as the next experiment.",
  },
];

export function CaseStudies() {
  return (
    <section id="work" className="bg-background py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <SectionHeader
            index="02"
            label="Representative scenarios"
            title="The kind of problem we're usually called in for."
          />
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Illustrative examples based on common failure patterns — not
            attributed to a specific client.
          </p>
        </Reveal>

        <div className="mt-16 border-t border-border">
          {SCENARIOS.map((s, i) => (
            <Reveal
              key={s.tag}
              delay={i * 0.08}
              className="grid grid-cols-1 gap-3 border-b border-border py-8 sm:gap-4 sm:py-10 lg:grid-cols-[3rem_1fr_1fr] lg:items-baseline lg:gap-10"
            >
              <span className="font-mono text-sm text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-accent">
                  {s.tag}
                </span>
                <div className="mt-2 flex items-center gap-2 text-base font-medium">
                  <span className="text-muted-foreground">{s.before}</span>
                  <ArrowRight size={14} weight="bold" className="shrink-0 text-accent" />
                  <span className="text-primary">{s.after}</span>
                </div>
              </div>
              <p className="text-[15px] leading-relaxed text-secondary">
                {s.story}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
