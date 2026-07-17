import {
  TestTube,
  ChartLineUp,
  ListChecks,
  Gauge,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/reveal";
import { SpotlightCard } from "@/components/spotlight-card";

const SERVICES = [
  {
    icon: TestTube,
    title: "Formulation diagnostics",
    description:
      "Root-causing why a formulation underperforms — strength, bonding, durability, stability — with senior judgement, not guesswork.",
  },
  {
    icon: ChartLineUp,
    title: "Characterisation interpretation",
    description:
      "NMR, FTIR, TGA and DSC data turned into a clear account of what's chemically happening — a spectrum becomes a decision, not a file to archive.",
  },
  {
    icon: ListChecks,
    title: "Next-experiment roadmapping",
    description:
      "Every review ends with a prioritised set of experiments — the ones most likely to resolve the open question.",
  },
  {
    icon: Gauge,
    title: "Scale-up & production fit",
    description:
      "Recommendations scoped for what's actually manufacturable — practical changes that improve performance without adding process complexity.",
  },
];

export function Services() {
  return (
    <section id="services" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
            What we do
          </p>
          <h2 className="mt-4 text-balance font-display text-4xl font-medium leading-tight text-primary sm:text-5xl">
            Chemistry judgement, applied where the data gets ambiguous.
          </h2>
        </Reveal>

        <Reveal
          as="div"
          stagger
          staggerAmount={0.1}
          className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2"
        >
          {SERVICES.map(({ icon: Icon, title, description }) => (
            <SpotlightCard
              key={title}
              className="flex flex-col gap-4 bg-card p-8 transition-colors hover:bg-muted lg:p-10"
            >
              <Icon size={28} weight="regular" className="text-accent" />
              <h3 className="font-display text-xl font-medium text-primary">
                {title}
              </h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            </SpotlightCard>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
