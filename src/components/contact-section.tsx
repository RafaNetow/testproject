import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/reveal";
import { ContactForm } from "@/components/contact-form";

// hello@alchemica.com is a placeholder matching the placeholder brand name — replace with the real inbox before launch.

export function ContactSection() {
  return (
    <section id="contact" className="bg-muted py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 lg:grid-cols-2 lg:gap-12 lg:px-10">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
            Get in touch
          </p>
          <h2 className="mt-4 text-balance font-display text-4xl font-medium leading-tight text-primary sm:text-5xl">
            Bring us your hardest formulation question.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Tell us what you&apos;re seeing — a failure mode, a confusing
            dataset, a formulation that won&apos;t scale — and we&apos;ll
            follow up with next steps.
          </p>
          <a
            href="mailto:hello@alchemica.com"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent"
          >
            <EnvelopeSimple size={18} />
            hello@alchemica.com
          </a>
        </Reveal>

        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
