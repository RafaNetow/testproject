"use client";

import { useMemo, useRef } from "react";
import { Quotes } from "@phosphor-icons/react/dist/ssr";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

const QUOTE =
  "A spectrum isn't an answer — it's a question waiting for someone who knows how to read it.";

/**
 * A full-bleed editorial break between Approach and Case Studies — a
 * deliberate rhythm change so the page isn't just label/heading/card-grid
 * on repeat. On desktop the quote types itself in as the section is pinned
 * and scrolled through; on touch, pinning fights the natural scroll gesture,
 * so it plays as a single quick reveal on entering the viewport instead.
 */
export function PullQuote() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<HTMLParagraphElement>(null);
  const words = useMemo(() => QUOTE.split(" "), []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        "(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (pointer: fine)",
        () => {
          const wordEls = wordsRef.current?.querySelectorAll(".quote-word");
          if (!wordEls?.length) return;

          gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "+=700",
              scrub: 0.4,
              pin: true,
            },
          }).to(wordEls, {
            opacity: 1,
            duration: 0.3,
            stagger: 0.55,
            ease: "none",
          });
        }
      );

      mm.add(
        "(prefers-reduced-motion: no-preference) and (max-width: 1023px), (prefers-reduced-motion: no-preference) and (pointer: coarse)",
        () => {
          const wordEls = wordsRef.current?.querySelectorAll(".quote-word");
          if (!wordEls?.length) return;

          gsap.to(wordEls, {
            opacity: 1,
            duration: 0.4,
            stagger: 0.05,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          });
        }
      );

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(wordsRef.current?.querySelectorAll(".quote-word") ?? [], {
          opacity: 1,
        });
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-background py-20 sm:py-28 lg:py-36"
    >
      <Quotes
        size={200}
        weight="fill"
        aria-hidden="true"
        className="pointer-events-none absolute -left-4 -top-8 text-primary/[0.05] lg:-left-6 lg:-top-10"
      />
      <div className="relative mx-auto max-w-4xl px-6 lg:px-10">
        <p
          ref={wordsRef}
          className="text-balance font-display text-3xl font-medium italic leading-snug text-primary sm:text-4xl lg:text-5xl"
        >
          {words.map((word, i) => (
            <span key={i} className="quote-word opacity-[0.12]">
              {word}{" "}
            </span>
          ))}
          <span
            aria-hidden="true"
            className="quote-cursor ml-1 inline-block h-[0.85em] w-[3px] translate-y-[0.12em] bg-accent align-middle"
          />
        </p>
      </div>
    </section>
  );
}
