"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

type MagneticButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

/** A link that pulls slightly toward the cursor while hovered, and eases back on leave. */
export function MagneticButton({ href, children, className }: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)", () => {
        const el = ref.current!;
        const setX = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
        const setY = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

        const onMove = (e: MouseEvent) => {
          const rect = el.getBoundingClientRect();
          setX((e.clientX - rect.left - rect.width / 2) * 0.35);
          setY((e.clientY - rect.top - rect.height / 2) * 0.35);
        };
        const onLeave = () => {
          setX(0);
          setY(0);
        };

        el.addEventListener("mousemove", onMove);
        el.addEventListener("mouseleave", onLeave);
        return () => {
          el.removeEventListener("mousemove", onMove);
          el.removeEventListener("mouseleave", onLeave);
        };
      });

      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <a ref={ref} href={href} className={`inline-block will-change-transform ${className ?? ""}`}>
      {children}
    </a>
  );
}
