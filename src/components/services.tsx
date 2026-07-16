import {
  TestTube,
  ChartLineUp,
  ListChecks,
  Gauge,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/reveal";

const SERVICES = [
  {
    icon: TestTube,
    title: "Formulation diagnostics",
    description:
      "We work through why a formulation is under-performing — strength, bonding, durability, water resistance or stability — using senior chemistry judgement, not guesswork.",
  },
  {
    icon: ChartLineUp,
    title: "Characterisation interpretation",
    description:
      "NMR, FTIR, TGA and DSC data turned into a clear account of what's chemically happening, so a spectrum becomes a decision rather than a file to archive.",
  },
  {
    icon: ListChecks,
    title: "Next-experiment roadmapping",
    description:
      "Every review ends with a prioritised set of experiments — the ones most likely to resolve the open question — so R&D cycles get shorter, not longer.",
  },
  {
    icon: Gauge,
    title: "Scale-up & production fit",
    description:
      "Recommendations are scoped for what's actually manufacturable: practical, scalable changes that improve performance without adding unnecessary process complexity.",
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
            <div
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
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
