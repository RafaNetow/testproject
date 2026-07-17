"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

type ApproachStepProps = {
  number: string;
  title: string;
  description: string;
  index: number;
};

/**
 * A step's own motion signature — a large watermark numeral scales in first,
 * then the copy follows — deliberately distinct from the generic fade-up
 * `Reveal` used elsewhere on the page.
 */
export function ApproachStep({ number, title, description, index }: ApproachStepProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          delay: index * 0.1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });

        tl.from(numberRef.current, {
          opacity: 0,
          scale: 0.6,
          duration: 0.8,
          ease: "power3.out",
        }).from(
          contentRef.current ? Array.from(contentRef.current.children) : [],
          { opacity: 0, y: 20, duration: 0.6, stagger: 0.08, ease: "power2.out" },
          "-=0.45"
        );
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [index] }
  );

  return (
    <div ref={sectionRef} className="relative flex flex-col">
      <span
        ref={numberRef}
        aria-hidden="true"
        className="pointer-events-none select-none font-display text-[6rem] font-medium leading-none text-white/[0.07] lg:text-[7rem]"
      >
        {number}
      </span>
      <div ref={contentRef} className="relative -mt-7 flex flex-col gap-3 lg:-mt-9">
        <h3 className="font-display text-xl font-medium text-white">{title}</h3>
        <p className="text-[15px] leading-relaxed text-white/65">{description}</p>
      </div>
    </div>
  );
}
