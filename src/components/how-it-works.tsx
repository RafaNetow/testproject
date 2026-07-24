import { Reveal } from "@/components/reveal";
import { SectionHeader } from "@/components/section-header";

const STAGES = [
  {
    label: "Your data",
    detail:
      "Formulation records, characterisation results, failure modes — however messy.",
  },
  {
    label: "Mechanism review",
    detail:
      "A senior chemist works through what's actually happening at the molecular level.",
  },
  {
    label: "Root cause & recommendation",
    detail:
      "A written explanation and the changes most likely to move the properties you care about.",
  },
  {
    label: "Next experiment",
    detail: "Prioritised, so fewer batches get wasted getting there.",
  },
];

/**
 * "How we work" as an editorial ledger — a sticky heading column beside a
 * ruled list of stages with large italic numerals. Typography and hairline
 * rules carry the section; no cards, icons, or boxes.
 */
export function HowItWorks() {
  return (
    <section id="services" className="bg-primary py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-5 lg:gap-12">
          <Reveal className="lg:col-span-2">
            <div className="lg:sticky lg:top-32">
              <SectionHeader
                dark
                index="01"
                label="How we work"
                title="From ambiguous data to a confident next step."
              />
              <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-white/55">
                A single structured review with a clear deliverable at the
                end — not an open-ended retainer.
              </p>
            </div>
          </Reveal>

          <div className="lg:col-span-3">
            <Reveal as="div" stagger staggerAmount={0.1} className="border-t border-white/10">
              {STAGES.map((stage, i) => (
                <div
                  key={stage.label}
                  className="grid grid-cols-[3.25rem_1fr] items-baseline gap-4 border-b border-white/10 py-8 sm:grid-cols-[4.5rem_1fr] sm:gap-5 sm:py-10 lg:gap-8 lg:py-12"
                >
                  <span className="font-display text-3xl italic leading-none text-accent sm:text-4xl lg:text-5xl">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-medium leading-tight text-white sm:text-2xl">
                      {stage.label}
                    </h3>
                    <p className="mt-2 max-w-md text-[15px] leading-relaxed text-white/55">
                      {stage.detail}
                    </p>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
