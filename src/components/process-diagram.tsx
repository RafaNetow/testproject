"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Reveal } from "@/components/reveal";

const STAGES = [
  {
    label: "Your data",
    detail: "Formulation records, characterisation results, failure modes — however messy.",
  },
  {
    label: "Mechanism review",
    detail: "A senior chemist explains what's happening at the molecular level.",
  },
  {
    label: "Root cause & recommendation",
    detail: "A written explanation and the changes most likely to help.",
  },
  {
    label: "Next experiment",
    detail: "Prioritised, so fewer batches get wasted getting there.",
  },
];

const LINE = "rgba(56, 142, 210, 0.85)";

/**
 * The page's one signature moment — a literal process diagram in the same
 * molecular dots-and-bonds language as the About panel's ambient canvas,
 * replacing what used to be two separate card-grid sections (Services,
 * Approach) that described overlapping ground in prose.
 */
export function ProcessDiagram() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Both the desktop and mobile layouts exist in the DOM at once (one is
      // just display:none), so each entrance animation is scoped to only
      // its own layout's elements — otherwise a single shared stagger would
      // run across all 8 nodes regardless of which set is actually visible.
      const animate = (scope: ".process-desktop" | ".process-mobile") => {
        const nodes = sectionRef.current?.querySelectorAll(`${scope} .process-node`);
        const lines = sectionRef.current?.querySelectorAll(`${scope} .process-line`);
        if (!nodes?.length || !lines) return;

        gsap
          .timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 70%",
              toggleActions: "play none none reverse",
            },
          })
          .from(
            nodes,
            { opacity: 0, scale: 0.5, duration: 0.5, stagger: 0.35, ease: "back.out(2)" },
            0
          )
          .fromTo(
            lines,
            { strokeDashoffset: 100 },
            { strokeDashoffset: 0, duration: 0.5, stagger: 0.35, ease: "power2.inOut" },
            0.25
          );
      };

      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
        animate(".process-desktop");
      });

      mm.add("(prefers-reduced-motion: no-preference) and (max-width: 1023px)", () => {
        animate(".process-mobile");
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(sectionRef.current?.querySelectorAll(".process-node") ?? [], {
          opacity: 1,
          scale: 1,
        });
        gsap.set(sectionRef.current?.querySelectorAll(".process-line") ?? [], {
          strokeDashoffset: 0,
        });
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section id="services" ref={sectionRef} className="bg-primary py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/50">
            How it works
          </p>
          <h2 className="mt-4 text-balance font-display text-5xl font-medium leading-[1.05] text-white sm:text-6xl">
            From ambiguous data to a confident next step.
          </h2>
        </Reveal>

        {/* Desktop: horizontal flow */}
        <div className="process-desktop mt-24 hidden lg:flex lg:items-start">
          {STAGES.map((stage, i) => (
            <div key={stage.label} className="flex flex-1 items-start last:flex-none">
              <div className="flex w-full flex-col items-start">
                <span
                  className="process-node h-3 w-3 shrink-0 rounded-full bg-accent"
                  style={{ boxShadow: `0 0 0 4px ${LINE}` }}
                />
                <h3 className="mt-6 font-display text-xl font-medium leading-tight text-white">
                  {stage.label}
                </h3>
                <p className="mt-2 max-w-[15rem] text-[14px] leading-relaxed text-white/55">
                  {stage.detail}
                </p>
              </div>
              {i < STAGES.length - 1 && (
                <svg viewBox="0 0 100 2" preserveAspectRatio="none" className="mt-[5px] h-[2px] w-full shrink-0">
                  <line
                    x1="0"
                    y1="1"
                    x2="100"
                    y2="1"
                    stroke={LINE}
                    strokeWidth="2.5"
                    className="process-line"
                    strokeDasharray="100"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* Mobile/tablet: vertical flow */}
        <div className="process-mobile mt-16 flex flex-col lg:hidden">
          {STAGES.map((stage, i) => (
            <div key={stage.label} className="flex gap-5">
              <div className="flex flex-col items-center">
                <span
                  className="process-node h-3 w-3 shrink-0 rounded-full bg-accent"
                  style={{ boxShadow: `0 0 0 4px ${LINE}` }}
                />
                {i < STAGES.length - 1 && (
                  <svg viewBox="0 0 2 100" preserveAspectRatio="none" className="my-1 w-[2px] flex-1">
                    <line
                      x1="1"
                      y1="0"
                      x2="1"
                      y2="100"
                      stroke={LINE}
                      strokeWidth="2.5"
                      className="process-line"
                      strokeDasharray="100"
                    />
                  </svg>
                )}
              </div>
              <div className={i < STAGES.length - 1 ? "pb-10" : ""}>
                <h3 className="font-display text-xl font-medium leading-tight text-white">
                  {stage.label}
                </h3>
                <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-white/55">
                  {stage.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
