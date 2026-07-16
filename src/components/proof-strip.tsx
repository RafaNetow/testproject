import { Reveal } from "@/components/reveal";

const TECHNIQUES = [
  { label: "NMR", desc: "Structure & purity" },
  { label: "FTIR", desc: "Bonding & functional groups" },
  { label: "TGA", desc: "Thermal stability" },
  { label: "DSC", desc: "Phase behaviour" },
];

export function ProofStrip() {
  return (
    <section className="border-b border-border bg-card">
      <Reveal
        as="div"
        stagger
        className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-14 sm:grid-cols-4 lg:gap-12 lg:px-10 lg:py-16"
      >
        {TECHNIQUES.map((t) => (
          <div key={t.label} className="flex flex-col gap-1">
            <span className="font-mono text-2xl font-medium tracking-tight text-primary lg:text-3xl">
              {t.label}
            </span>
            <span className="text-sm text-muted-foreground">{t.desc}</span>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
