"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Custom cursor: a nucleus glued to the pointer with three tilted electron
 * orbits trailing behind it, growing over anything clickable. Desktop-only
 * (fine pointer + hover capability) and skipped entirely under
 * prefers-reduced-motion, both via matchMedia so it never mounts on touch.
 */
export function Cursor() {
  const nucleusRef = useRef<HTMLDivElement>(null);
  const orbitsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduceMotion) return;

    document.documentElement.classList.add("custom-cursor-active");

    const nucleus = nucleusRef.current;
    const orbits = orbitsRef.current;
    if (!nucleus || !orbits) return;

    const setNucleusX = gsap.quickTo(nucleus, "left", { duration: 0.1, ease: "power3.out" });
    const setNucleusY = gsap.quickTo(nucleus, "top", { duration: 0.1, ease: "power3.out" });
    const setOrbitsX = gsap.quickTo(orbits, "left", { duration: 0.45, ease: "power3.out" });
    const setOrbitsY = gsap.quickTo(orbits, "top", { duration: 0.45, ease: "power3.out" });

    const onMove = (e: MouseEvent) => {
      setNucleusX(e.clientX);
      setNucleusY(e.clientY);
      setOrbitsX(e.clientX);
      setOrbitsY(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a, button, [data-cursor-hover]");
      const active = Boolean(target);
      orbits.classList.toggle("cursor-atom-orbits--active", active);
      nucleus.classList.toggle("cursor-atom-nucleus--active", active);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, []);

  return (
    <>
      <div ref={nucleusRef} className="cursor-atom-nucleus" aria-hidden="true" />
      <div ref={orbitsRef} className="cursor-atom-orbits" aria-hidden="true">
        <div className="atom-orbit atom-orbit-1">
          <div className="atom-orbit-spin">
            <span className="atom-electron" />
          </div>
        </div>
        <div className="atom-orbit atom-orbit-2">
          <div className="atom-orbit-spin">
            <span className="atom-electron" />
          </div>
        </div>
        <div className="atom-orbit atom-orbit-3">
          <div className="atom-orbit-spin">
            <span className="atom-electron" />
          </div>
        </div>
      </div>
    </>
  );
}
