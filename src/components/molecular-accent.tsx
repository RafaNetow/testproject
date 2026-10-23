"use client";

import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { prefersReducedMotion } from "@/lib/motion-pref";

type Particle = { x: number; y: number; vx: number; vy: number };

const TONES = {
  // Brand verdigris (--color-accent).
  accent: { line: "47,125,109", dot: "47,125,109" },
  // Whiter/brighter — for small dark panels (sidebar, dashboard hero) where
  // the muted accent blue all but disappears against a near-black background.
  bright: { line: "224,242,254", dot: "255,255,255" },
} as const;

/**
 * Contained ambient network of drifting dots with connecting lines —
 * the same "molecular bond" motif used in the client/admin portal, scaled
 * down to fill a single bounded panel rather than the whole viewport.
 */
export function MolecularAccent({
  opacity = 0.7,
  tone = "accent",
  particleCount = 26,
  desktopOnly = true,
  intro = false,
}: {
  /** The canvas always fills its (positioned) parent; this only sets how strong it reads. */
  opacity?: number;
  tone?: keyof typeof TONES;
  particleCount?: number;
  /** Skip the rAF loop below 1024px — set false when the panel is actually visible on mobile too. */
  desktopOnly?: boolean;
  /** The network starts gathered in the middle and spreads out over a second, like a reaction starting. */
  intro?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // In desktopOnly contexts (sidebar, login) this panel is hidden below
    // 1024px, so skip the particle-physics rAF loop entirely rather than
    // running it forever off-screen.
    if (desktopOnly && !window.matchMedia("(min-width: 1024px)").matches) return;

    const reduceMotion = prefersReducedMotion();
    const { line: lineRgb, dot: dotRgb } = TONES[tone];
    let particles: Particle[] = [];
    let raf = 0;
    const started = performance.now();
    const INTRO_MS = 1300;

    function resize() {
      const rect = parent!.getBoundingClientRect();
      canvas!.width = rect.width;
      canvas!.height = rect.height;
    }

    function initParticles(count: number) {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      }));
    }

    function render() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas!.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas!.height) p.vy *= -1;
      });

      // Intro: draw each particle pulled toward the centre, easing out to its real place.
      const k = intro && !reduceMotion ? 1 - Math.pow(1 - Math.min(1, (performance.now() - started) / INTRO_MS), 3) : 1;
      const cx = canvas!.width / 2;
      const cy = canvas!.height / 2;
      const at = (p: Particle) => ({ x: cx + (p.x - cx) * (0.15 + 0.85 * k), y: cy + (p.y - cy) * (0.15 + 0.85 * k) });
      const drawn = particles.map(at);

      for (let i = 0; i < drawn.length; i++) {
        for (let j = i + 1; j < drawn.length; j++) {
          const a = drawn[i];
          const b = drawn[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 110) {
            ctx!.strokeStyle = `rgba(${lineRgb},${(1 - dist / 110) * 0.4 * k})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }
      drawn.forEach((p) => {
        ctx!.fillStyle = `rgba(${dotRgb},${0.2 + 0.4 * k})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx!.fill();
      });
    }

    function tick() {
      render();
      raf = requestAnimationFrame(tick);
    }

    resize();
    initParticles(particleCount);
    render();
    if (!reduceMotion) tick();

    const onResize = () => {
      resize();
      render();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [tone, particleCount, desktopOnly, intro]);

  return (
    <Box
      component="canvas"
      ref={canvasRef}
      aria-hidden="true"
      sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity }}
    />
  );
}
