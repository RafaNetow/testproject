import Image from "next/image";
import { Reveal } from "@/components/reveal";

export function About() {
  return (
    <section id="about" className="bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-5">
        <Reveal className="relative min-h-[360px] lg:col-span-2 lg:min-h-[520px]">
          <Image
            src="/images/axel-headshot.webp"
            alt="Axel Rosenvinge, founder of Alchemica"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover object-top"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-6 pt-16 lg:p-8 lg:pt-20">
            <p className="font-display text-lg text-white">Axel Rosenvinge</p>
            <p className="font-mono text-xs uppercase tracking-widest text-white/70">
              Founder, Alchemica
            </p>
          </div>
        </Reveal>

        <Reveal
          delay={0.1}
          className="flex flex-col justify-center gap-6 px-6 py-16 lg:col-span-3 lg:px-16 lg:py-24"
        >
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
              About Alchemica
            </p>
            <h2 className="mt-4 text-balance font-display text-4xl font-medium leading-tight text-primary sm:text-5xl">
              Senior chemistry judgement, on tap when a project needs it.
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-secondary">
            I started Alchemica because most material R&amp;D teams
            don&apos;t need another lab report — they need someone who can
            read it, explain what it means chemically, and say what to try
            next. The goal on every engagement: turn ambiguous data into a
            decision you can act on this week, not next quarter.
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Trained at
            </span>
            <span className="text-sm font-medium text-secondary">
              Imperial College London
            </span>
            <span className="text-border">·</span>
            <span className="text-sm font-medium text-secondary">MIT</span>
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
    </section>
  );
}
