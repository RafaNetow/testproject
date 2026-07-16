import { Reveal } from "@/components/reveal";

const SCENARIOS = [
  {
    tag: "Bio-based adhesive",
    challenge: "Bond strength dropped sharply after humidity exposure, with no clear pattern across batches.",
    approach:
      "FTIR and DSC data pointed to a plasticiser migrating to the bond line over time rather than a cure failure.",
    outcome:
      "Trials redirected toward a crosslinker swap instead of a full reformulation — cutting weeks off the investigation.",
  },
  {
    tag: "Industrial polymer blend",
    challenge: "A blend that performed well at lab scale became brittle after pilot-line scale-up.",
    approach:
      "TGA and mechanical data suggested a processing temperature window was narrower than the lab process assumed.",
    outcome:
      "A scoped processing adjustment restored ductility without changing the formulation or adding new raw materials.",
  },
  {
    tag: "Water-resistant coating",
    challenge: "Water resistance was inconsistent between formulation variants for reasons the team couldn't isolate.",
    approach:
      "NMR review identified an unreacted monomer fraction correlating with the weaker-performing batches.",
    outcome:
      "A revised cure schedule became the next experiment, prioritised over three lower-probability alternatives.",
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
            Illustrative examples based on common failure patterns across
            bio-based, polymeric and industrial material systems — not
            attributed to a specific client.
          </p>
        </Reveal>

        <Reveal
          as="div"
          stagger
          staggerAmount={0.1}
          className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {SCENARIOS.map((s) => (
            <div
              key={s.tag}
              className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-8"
            >
              <span className="font-mono text-xs uppercase tracking-widest text-accent">
                {s.tag}
              </span>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Challenge
                  </p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-secondary">
                    {s.challenge}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Approach
                  </p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-secondary">
                    {s.approach}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Outcome
                  </p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-secondary">
                    {s.outcome}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
