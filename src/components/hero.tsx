"use client";

import { Fragment, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

const HEADLINE: { text: string; italic?: boolean }[] = [
  { text: "Fewer" },
  { text: "failed" },
  { text: "batches." },
  { text: "Sharper", italic: true },
  { text: "next" },
  { text: "experiments." },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Entrance — word-mask reveal on the headline, fade-up on everything else.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (!contentRef.current || !headlineRef.current) return;

        const tl = gsap.timeline({ delay: 0.15 });
        tl.from(headlineRef.current.querySelectorAll(".word-inner"), {
          yPercent: 110,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.05,
        }).from(
          [...contentRef.current.children].filter((el) => el !== headlineRef.current),
          {
            opacity: 0,
            y: 24,
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.1,
          },
          "-=0.5"
        );
      });

      // Scroll-scrub zoom — slow start, dramatic finish — pinned to the hero.
      // Desktop-only: pinning + scrubbing against touch scroll fights the
      // platform's native momentum feel rather than enhancing it.
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (pointer: fine)", () => {
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
          .to(frameRef.current, { scale: 1.1, duration: 0.35, ease: "none" }, 0)
          .to(frameRef.current, { scale: 1.65, duration: 0.65, ease: "none" }, 0.35)
          .to(contentRef.current, { opacity: 0, y: -50, duration: 1, ease: "none" }, 0)
          .to(overlayRef.current, { opacity: 0.72, duration: 1, ease: "none" }, 0);
      });

      // Mobile/touch substitute — a gentle, load-triggered breathing zoom
      // instead of a scroll-linked one, so the hero still feels alive
      // without hijacking the scroll gesture.
      mm.add(
        "(prefers-reduced-motion: no-preference) and (max-width: 1023px), (prefers-reduced-motion: no-preference) and (pointer: coarse)",
        () => {
          if (!frameRef.current) return;
          gsap.fromTo(
            frameRef.current,
            { scale: 1.12 },
            { scale: 1, duration: 2.2, ease: "power2.out", delay: 0.2 }
          );
        }
      );

      // Mouse-reactive parallax — video drifts opposite the cursor, content drifts less.
      mm.add("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)", () => {
        if (!sectionRef.current || !frameRef.current || !contentRef.current) return;

        const setFrameX = gsap.quickTo(frameRef.current, "x", { duration: 0.8, ease: "power3.out" });
        const setFrameY = gsap.quickTo(frameRef.current, "y", { duration: 0.8, ease: "power3.out" });
        const setContentX = gsap.quickTo(contentRef.current, "x", { duration: 0.8, ease: "power3.out" });
        const setContentY = gsap.quickTo(contentRef.current, "y", { duration: 0.8, ease: "power3.out" });

        const onMove = (e: MouseEvent) => {
          const rect = sectionRef.current!.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          setFrameX(px * -24);
          setFrameY(py * -24);
          setContentX(px * 8);
          setContentY(py * 8);
        };

        sectionRef.current.addEventListener("mousemove", onMove);
        return () => sectionRef.current?.removeEventListener("mousemove", onMove);
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative min-h-dvh w-full overflow-hidden bg-primary"
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
        className="relative z-10 mx-auto flex min-h-dvh max-w-7xl flex-col items-start justify-end gap-5 px-6 pb-16 pt-28 sm:gap-6 sm:pb-24 lg:px-10 lg:pb-32"
      >
        <h1
          ref={headlineRef}
          className="max-w-3xl text-balance font-display text-5xl font-medium leading-[1.05] text-white sm:text-6xl lg:text-7xl"
        >
          {/* Real spaces between the masked words, so the heading reads (and
              copies, and is announced) as a sentence rather than one long token. */}
          {HEADLINE.map((word, i) => (
            <Fragment key={i}>
              {i > 0 && " "}
              <span className="inline-block overflow-hidden align-bottom">
                <span
                  className={`word-inner inline-block ${word.italic ? "italic text-white/90" : ""}`}
                >
                  {word.text}
                </span>
              </span>
            </Fragment>
          ))}
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
          Senior chemistry advisory for R&amp;D teams building bio-based,
          polymeric and industrial materials.
        </p>
        <div className="flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4">
          <a
            href="#contact"
            className="btn-primary rounded-full px-6 py-3.5 text-center text-sm font-medium"
          >
            Start a conversation
          </a>
          <a
            href="#services"
            className="rounded-full border border-white/30 px-6 py-3.5 text-center text-sm font-medium text-white transition-colors hover:border-white/60"
          >
            See how we work
          </a>
        </div>
        <p className="pt-3 text-sm leading-relaxed text-white/70 sm:pt-4">
          Trained at MIT, Imperial College London and Aarhus University.
        </p>
      </div>
    </section>
  );
}
