import { Reveal } from "@/components/reveal";
import { ApproachStep } from "@/components/approach-step";

const STEPS = [
  {
    number: "01",
    title: "Share what you have",
    description:
      "Formulation records, characterisation results, failure modes — whatever you've already got. No dataset is too messy to start from.",
  },
  {
    number: "02",
    title: "Mechanism review",
    description:
      "A senior chemist works through the data to explain what's happening at the molecular level — not just what the numbers say, but why.",
  },
  {
    number: "03",
    title: "Clear recommendation",
    description:
      "A written root-cause explanation and a short list of changes most likely to move the properties you care about.",
  },
  {
    number: "04",
    title: "Iterate with confidence",
    description:
      "Prioritised experiments mean fewer wasted batches — a faster path from 'it doesn't work' to 'here's what to try next.'",
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

        <div className="mt-20 grid grid-cols-1 gap-14 lg:grid-cols-4 lg:gap-10">
          {STEPS.map((step, i) => (
            <ApproachStep key={step.number} index={i} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}
