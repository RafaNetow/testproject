"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // Mobile browsers resize the viewport as the address bar shows/hides while
  // scrolling — without this, that resize re-triggers ScrollTrigger's pin
  // recalculation mid-scroll and causes visible jumps.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger };
