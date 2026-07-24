import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { SectionHeader } from "@/components/section-header";

const INSTITUTIONS = ["MIT", "Imperial College London", "Aarhus University"];

export function About() {
  return (
    <section id="about" className="bg-background py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <SectionHeader
            index="03"
            label="About Alchemica"
            title="Senior chemistry judgement, on tap when a project needs it."
          />
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-10 sm:mt-14 sm:gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-4">
            <div className="flex flex-col items-start gap-5">
              <div className="relative aspect-square w-40 overflow-hidden rounded-full border border-border shadow-sm lg:w-52">
                <Image
                  src="/images/axel-headshot.webp"
                  alt="Axel Rosenvinge, founder of Alchemica"
                  fill
                  sizes="(min-width: 1024px) 13rem, 10rem"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-display text-xl text-primary">
                  Axel Rosenvinge
                </p>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Founder, Alchemica
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col gap-6 lg:col-span-8">
            <p className="text-lg leading-relaxed text-secondary">
              I started Alchemica because most R&amp;D teams don&apos;t need
              another lab report — they need someone who can read it and say
              what to try next. Every engagement ends in a decision you can
              act on this week.
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-6">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Trained at
              </span>
              {INSTITUTIONS.map((name, i) => (
                <span key={name} className="flex items-center gap-x-3">
                  {i > 0 && <span className="text-border">·</span>}
                  <span className="text-sm font-medium text-secondary">
                    {name}
                  </span>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {["NMR", "FTIR", "TGA", "DSC"].map((technique) => (
                <span
                  key={technique}
                  className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs uppercase tracking-wide text-accent"
                >
                  {technique}
                </span>
              ))}
            </div>
            <a
              href="#contact"
              className="mt-2 flex w-fit items-center gap-2 rounded-full border border-primary px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Get in touch
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
