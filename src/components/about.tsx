import { Reveal } from "@/components/reveal";
import { MolecularAccent } from "@/components/molecular-accent";
import { MagneticButton } from "@/components/magnetic-button";

/**
 * Placeholder copy — swap in real founder/team bio, photo and credentials
 * before launch. Intentionally generic for now so nothing here reads as a
 * fabricated claim.
 */
export function About() {
  return (
    <section id="about" className="bg-background py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 lg:grid-cols-2 lg:gap-12 lg:px-10">
        <Reveal className="flex min-h-[420px] flex-col">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
              About Alchemica
            </p>
            <h2 className="mt-4 text-balance font-display text-4xl font-medium leading-tight text-primary sm:text-5xl">
              Senior chemistry judgement, on tap when a project needs it.
            </h2>
          </div>
          <div className="relative mt-8 flex-1 overflow-hidden rounded-2xl border border-border bg-card">
            <MolecularAccent className="absolute inset-0 h-full w-full" />
          </div>
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col gap-6">
          <p className="text-lg leading-relaxed text-secondary">
            Alchemica exists because most material R&amp;D teams don&apos;t need
            another lab report — they need someone who can read the report,
            explain what it means chemically, and say what to try next.
          </p>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            We work directly with founders, CTOs and R&amp;D leads on
            bio-based, polymeric and industrial material systems, combining
            hands-on formulation experience with fluency across NMR, FTIR,
            TGA, DSC and other characterisation techniques. The goal on every
            engagement is the same: turn ambiguous data into a decision you
            can act on this week, not next quarter.
          </p>
          <MagneticButton
            href="#contact"
            className="mt-2 flex w-fit items-center gap-2 rounded-full border border-primary px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Get in touch
          </MagneticButton>
        </Reveal>
      </div>
    </section>
  );
}
