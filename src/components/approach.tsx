import { Reveal } from "@/components/reveal";

const STEPS = [
  {
    number: "01",
    title: "Share what you have",
    description:
      "Formulation records, characterisation results, failure modes, and whatever else you've already tried. No dataset is too messy to start from.",
  },
  {
    number: "02",
    title: "Mechanism review",
    description:
      "A senior chemist works through the data to explain what's actually happening at the molecular level — not just what the numbers say, but why.",
  },
  {
    number: "03",
    title: "Clear recommendation",
    description:
      "You get a written root-cause explanation and a short list of the changes most likely to move the properties you care about.",
  },
  {
    number: "04",
    title: "Iterate with confidence",
    description:
      "Prioritised next experiments mean fewer wasted batches and a faster path from 'it doesn't work' to 'we know why, and what to try next.'",
  },
];

export function Approach() {
  return (
    <section id="approach" className="bg-primary py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/50">
            How we work
          </p>
          <h2 className="mt-4 text-balance font-display text-4xl font-medium leading-tight text-white sm:text-5xl">
            A structured route from confusing data to a confident next step.
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((step, i) => (
            <Reveal key={step.number} delay={i * 0.05} className="flex flex-col gap-4">
              <span className="font-mono text-sm text-white/40">
                {step.number}
              </span>
              <h3 className="font-display text-xl font-medium text-white">
                {step.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-white/65">
                {step.description}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
