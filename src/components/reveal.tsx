"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
  /** Stagger direct children instead of animating the wrapper as one block */
  stagger?: boolean;
  staggerAmount?: number;
  delay?: number;
};

export function Reveal({
  children,
  className,
  as = "div",
  stagger = false,
  staggerAmount = 0.08,
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (!ref.current) return;
        const targets = stagger
          ? Array.from(ref.current.children)
          : ref.current;

        gsap.from(targets, {
          opacity: 0,
          y: 24,
          duration: 0.6,
          delay,
          ease: "power2.out",
          stagger: stagger ? staggerAmount : 0,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      });

      return () => mm.revert();
    },
    { scope: ref }
  );

  const Comp = as;
  return (
    <Comp ref={ref} className={className}>
      {children}
    </Comp>
  );
}
