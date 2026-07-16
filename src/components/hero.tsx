"use client";

import { useRef } from "react";
import { ArrowDown } from "@phosphor-icons/react/dist/ssr";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Entrance animation — plays once on load, all motion levels.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (!contentRef.current) return;
        gsap.from(contentRef.current.children, {
          opacity: 0,
          y: 28,
          duration: 0.8,
          delay: 0.2,
          ease: "power2.out",
          stagger: 0.12,
        });
      });

      // Scroll-scrub zoom — only for users who accept motion.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (!sectionRef.current || !frameRef.current) return;

        gsap
          .timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "+=100%",
              scrub: 1,
              pin: true,
            },
          })
          .to(frameRef.current, { scale: 1.35, ease: "none" }, 0)
          .to(contentRef.current, { opacity: 0, y: -50, ease: "none" }, 0)
          .to(overlayRef.current, { opacity: 0.72, ease: "none" }, 0);
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-primary"
    >
      <div ref={frameRef} className="absolute inset-0 will-change-transform">
        <video
          className="h-full w-full object-cover"
          src="/videos/hero-reaction.mp4"
          poster="/videos/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-primary/45 opacity-100"
        />
      </div>

      <div
        ref={contentRef}
        className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-start justify-end gap-6 px-6 pb-24 lg:px-10 lg:pb-32"
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/70">
          Chemistry &amp; Materials Advisory
        </p>
        <h1 className="max-w-3xl text-balance font-display text-5xl font-medium leading-[1.05] text-white sm:text-6xl lg:text-7xl">
          Fewer failed batches.{" "}
          <span className="italic text-white/90">Sharper</span> next
          experiments.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-white/80">
          We turn formulation data, characterisation results and chemical
          mechanisms into clear next experiments — for founders, CTOs and R&amp;D
          teams building bio-based, polymeric and industrial material systems.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <a
            href="#contact"
            className="rounded-full bg-white px-6 py-3.5 text-sm font-medium text-primary transition-colors hover:bg-white/90"
          >
            Start a conversation
          </a>
          <a
            href="#services"
            className="rounded-full border border-white/30 px-6 py-3.5 text-sm font-medium text-white transition-colors hover:border-white/60"
          >
            See how we work
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 right-6 z-10 hidden items-center gap-2 text-white/60 lg:right-10 md:flex">
        <span className="font-mono text-xs uppercase tracking-widest">
          Scroll
        </span>
        <ArrowDown size={16} className="animate-bounce" />
      </div>
    </section>
  );
}
