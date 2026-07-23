import {
  FileText,
  MagnifyingGlass,
  Lightbulb,
  TestTube,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/reveal";
import { MolecularAccent } from "@/components/molecular-accent";

const STAGES = [
  {
    icon: FileText,
    label: "Your data",
    detail:
      "Formulation records, characterisation results, failure modes — however messy.",
  },
  {
    icon: MagnifyingGlass,
    label: "Mechanism review",
    detail: "A senior chemist explains what's happening at the molecular level.",
  },
  {
    icon: Lightbulb,
    label: "Root cause & recommendation",
    detail: "A written explanation and the changes most likely to help.",
  },
  {
    icon: TestTube,
    label: "Next experiment",
    detail: "Prioritised, so fewer batches get wasted getting there.",
  },
];

/**
 * The page's one signature moment — an engagement-model breakdown carried
 * by real icon weight and generous spacing rather than thin decorative
 * lines. Ambient molecular texture (same motif as the About photo caption
 * used to carry) sits behind it at low opacity for depth, desktop-only.
 */
export function ProcessDiagram() {
  return (
    <section id="services" className="relative overflow-hidden bg-primary py-24 lg:py-32">
      <MolecularAccent className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/50">
            How it works
          </p>
          <h2 className="mt-4 text-balance font-display text-5xl font-medium leading-[1.05] text-white sm:text-6xl">
            From ambiguous data to a confident next step.
          </h2>
        </Reveal>

        <Reveal
          as="div"
          stagger
          staggerAmount={0.12}
          className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-8"
        >
          {STAGES.map(({ icon: Icon, label, detail }, i) => (
            <div key={label} className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5">
                  <Icon size={24} weight="light" className="text-accent" />
                </span>
                <span className="font-mono text-xs text-white/35">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div>
                <h3 className="font-display text-xl font-medium leading-tight text-white">
                  {label}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/55">
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
