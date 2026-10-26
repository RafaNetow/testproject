"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grow from "@mui/material/Grow";
import MobileStepper from "@mui/material/MobileStepper";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Typography from "@mui/material/Typography";
import {
  ArrowBack,
  AssistantIcon,
  BusinessOutlined,
  CalendarMonthOutlined,
  ChatOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  DatasetOutlined,
  DescriptionOutlined,
  HubOutlined,
  NavigateNext,
  NotificationsNoneOutlined,
  ReceiptLongOutlined,
  ScienceOutlined,
  Search,
  SettingsOutlined,
  SummarizeOutlined,
  TaskAltOutlined,
  TimelineOutlined,
  AccessTimeOutlined,
  type IconComponent,
} from "@/components/icons";
import { useReducedMotion } from "@/components/shared/motion";
import { markTourDone } from "@/lib/actions/tour";
import { whenRevealed } from "@/lib/route-loader";
import { ADMIN_TOUR, CLIENT_TOUR, type TourIcon } from "@/lib/tour-steps";
import { figureSx } from "@/lib/palette";

const TOUR_EVENT = "alchemica:tour";

/** Starts the welcome tour (Settings → "Take the tour"). */
export function startTour() {
  window.dispatchEvent(new Event(TOUR_EVENT));
}

const ICONS: Record<TourIcon, IconComponent> = {
  welcome: ScienceOutlined,
  nav: HubOutlined,
  summary: HubOutlined,
  clock: AccessTimeOutlined,
  todo: TaskAltOutlined,
  stages: TimelineOutlined,
  deliverables: SummarizeOutlined,
  files: DatasetOutlined,
  contracts: DescriptionOutlined,
  chat: ChatOutlined,
  bell: NotificationsNoneOutlined,
  settings: SettingsOutlined,
  clients: BusinessOutlined,
  calendar: CalendarMonthOutlined,
  invoices: ReceiptLongOutlined,
  assistant: AssistantIcon,
  search: Search,
  stats: DashboardOutlined,
  done: CheckCircleOutlined,
};

const PAD = 8;

/** The first matching element that is actually on screen (the sidebar exists twice: desktop and phone drawer). */
function findTarget(selector: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    if (r.width > 0 && r.height > 0 && style.visibility !== "hidden" && style.display !== "none") return el;
  }
  return null;
}

type Box4 = { top: number; left: number; width: number; height: number };

/**
 * The welcome tour: a spotlight that glides from one part of the portal to
 * the next, with an MUI Popper card explaining each one (MobileStepper dots,
 * Back / Next, Skip). Opens by itself the first time someone signs in (on the
 * home page, once the page loader has lifted) and again from Settings → Take
 * the tour. Finishing or skipping is remembered on the person's profile.
 */
export function OnboardingTour({ surface, autoStart }: { surface: "portal" | "admin"; autoStart: boolean }) {
  const steps = surface === "admin" ? ADMIN_TOUR : CLIENT_TOUR;
  const home = surface === "admin" ? "/admin" : "/portal";
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reduce = useReducedMotion();
  const titleId = useId();
  const bodyId = useId();

  const [index, setIndex] = useState<number | null>(null);
  const [spot, setSpot] = useState<Box4 | null>(null);
  const [arrowEl, setArrowEl] = useState<HTMLElement | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  // Finished in this page session: don't auto-start again before the layout refreshes.
  const finished = useRef(false);

  const step = index !== null ? steps[index] : null;
  const wantsTour = searchParams.get("tour") === "1";

  // Opens by itself on the home page the first time, or when asked with ?tour=1.
  useEffect(() => {
    if (pathname !== home || finished.current || !(autoStart || wantsTour)) return;
    let timer = 0;
    const cancel = whenRevealed(() => {
      timer = window.setTimeout(() => setIndex(0), 450);
    });
    return () => {
      cancel();
      window.clearTimeout(timer);
    };
  }, [pathname, home, autoStart, wantsTour]);

  // Settings → Take the tour.
  useEffect(() => {
    const onStart = () => {
      finished.current = false;
      if (window.location.pathname === home) setIndex(0);
      else router.push(`${home}?tour=1`);
    };
    window.addEventListener(TOUR_EVENT, onStart);
    return () => window.removeEventListener(TOUR_EVENT, onStart);
  }, [home, router]);

  // Follow the current step's target: scroll it into view, then measure (and keep measuring on scroll/resize).
  useEffect(() => {
    if (!step) return;
    let raf = 0;
    let settle = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = step.target ? findTarget(step.target) : null;
        if (!el) return setSpot(null);
        const r = el.getBoundingClientRect();
        // Keep the spotlight on screen and never taller than 60% of it, so the card always fits beside it.
        const vh = window.innerHeight;
        const top = Math.max(r.top - PAD, 8);
        const bottom = Math.min(r.bottom + PAD, vh - 8, top + vh * 0.6);
        setSpot({ top, left: r.left - PAD, width: r.width + PAD * 2, height: Math.max(bottom - top, 24) });
      });
    };
    const el = step.target ? findTarget(step.target) : null;
    if (el) {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const offscreen = r.top < 80 || r.bottom > vh - 40;
      if (offscreen) {
        // Tall targets sit just under the top bar; short ones in the middle.
        const tall = r.height > vh * 0.6;
        const y = window.scrollY + r.top - (tall ? 96 : (vh - r.height) / 2);
        window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
      }
      settle = window.setTimeout(measure, offscreen && !reduce ? 420 : 0);
    } else {
      measure();
    }
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, reduce]);

  const finish = useCallback(() => {
    finished.current = true;
    setIndex(null);
    setSpot(null);
    void markTourDone().then(() => router.refresh());
    if (wantsTour) router.replace(home, { scroll: false });
  }, [router, wantsTour, home]);

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      const next = index + delta;
      if (next >= steps.length) finish();
      else setIndex(Math.max(0, next));
    },
    [index, steps.length, finish]
  );

  // Keyboard: Esc skips, arrows move. Focus follows the Next button.
  useEffect(() => {
    if (index === null) return;
    nextRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, finish, go]);

  if (!step || index === null) return null;

  const Icon = ICONS[step.icon];
  const last = index === steps.length - 1;
  const centred = !spot;
  const glide = reduce ? "none" : "top 380ms cubic-bezier(0.2, 0.7, 0.2, 1), left 380ms cubic-bezier(0.2, 0.7, 0.2, 1), width 380ms cubic-bezier(0.2, 0.7, 0.2, 1), height 380ms cubic-bezier(0.2, 0.7, 0.2, 1), border-radius 380ms";
  // A virtual anchor for the Popper: the spotlight's rectangle.
  const anchor = spot
    ? { getBoundingClientRect: () => new DOMRect(spot.left, spot.top, spot.width, spot.height), contextElement: document.body }
    : null;

  const card = (
    <Paper
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      elevation={12}
      sx={{ width: { xs: "calc(100vw - 32px)", sm: 360 }, p: 2.5, borderRadius: 3, position: "relative" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.25 }}>
        <Box
          aria-hidden
          sx={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 1.5, flexShrink: 0, color: "primary.main", bgcolor: "color-mix(in srgb, var(--color-accent) 12%, transparent)" }}
        >
          <Icon sx={{ fontSize: 20, ...(step.icon === "settings" ? { animation: "gear-spin 8s linear infinite" } : {}) }} />
        </Box>
        <Typography sx={{ ...figureSx, fontSize: 12, color: "text.muted", flex: 1 }}>
          {index + 1} of {steps.length}
        </Typography>
        {!last && (
          <Button size="small" color="secondary" onClick={finish} sx={{ minWidth: 0, fontSize: 12 }}>
            Skip tour
          </Button>
        )}
      </Box>
      <Typography id={titleId} sx={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>
        {step.title}
      </Typography>
      <Typography id={bodyId} sx={{ mt: 0.75, fontSize: 14, lineHeight: 1.6, color: "text.secondary" }}>
        {step.body}
      </Typography>
      <MobileStepper
        variant="dots"
        steps={steps.length}
        activeStep={index}
        position="static"
        sx={{ mt: 2, p: 0, bgcolor: "transparent", "& .MuiMobileStepper-dot": { width: 6, height: 6, mx: 0.375 }, "& .MuiMobileStepper-dotActive": { width: 18, borderRadius: 3, transition: "width 250ms" } }}
        backButton={
          <Button size="small" color="secondary" onClick={() => go(-1)} disabled={index === 0} startIcon={<ArrowBack />}>
            Back
          </Button>
        }
        nextButton={
          <Button ref={nextRef} size="small" variant="contained" onClick={() => go(1)} endIcon={last ? undefined : <NavigateNext />}>
            {index === 0 ? "Start" : last ? "Done" : "Next"}
          </Button>
        }
      />
    </Paper>
  );

  return (
    <>
      {/* Blocks the page while the tour runs; the spotlight's huge shadow dims everything but the target. */}
      <Box aria-hidden sx={{ position: "fixed", inset: 0, zIndex: 1400 }} onClick={(e) => e.stopPropagation()} />
      <Box
        aria-hidden
        sx={{
          position: "fixed",
          zIndex: 1401,
          pointerEvents: "none",
          top: spot ? spot.top : "50%",
          left: spot ? spot.left : "50%",
          width: spot ? spot.width : 0,
          height: spot ? spot.height : 0,
          borderRadius: spot ? 3 : "50%",
          boxShadow: "0 0 0 9999px rgba(8, 18, 16, 0.58)",
          outline: spot ? "2px solid var(--color-accent)" : "none",
          outlineOffset: 2,
          transition: glide,
        }}
      />

      {centred ? (
        <Box sx={{ position: "fixed", inset: 0, zIndex: 1402, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <Grow key={step.id} in appear timeout={reduce ? 0 : 320}>
            <Box sx={{ pointerEvents: "auto" }}>{card}</Box>
          </Grow>
        </Box>
      ) : (
        <Popper
          open
          anchorEl={anchor}
          placement={step.placement ?? "bottom"}
          transition
          sx={{ zIndex: 1402 }}
          modifiers={[
            { name: "offset", options: { offset: [0, 16] } },
            { name: "preventOverflow", options: { padding: 16 } },
            { name: "flip", options: { padding: 16 } },
            { name: "arrow", enabled: Boolean(arrowEl), options: { element: arrowEl, padding: 14 } },
          ]}
        >
          {({ TransitionProps, placement }) => (
            <Grow key={step.id} {...TransitionProps} timeout={reduce ? 0 : 320} style={{ transformOrigin: placement.startsWith("top") ? "bottom center" : placement.startsWith("left") ? "right center" : placement.startsWith("right") ? "left center" : "top center" }}>
              <Box sx={{ position: "relative" }}>
                {card}
                <Box
                  ref={setArrowEl}
                  aria-hidden
                  sx={{
                    position: "absolute",
                    width: 14,
                    height: 14,
                    bgcolor: "background.paper",
                    transform: "rotate(45deg)",
                    zIndex: -1,
                    ...(placement.startsWith("bottom") && { top: -6 }),
                    ...(placement.startsWith("top") && { bottom: -6 }),
                    ...(placement.startsWith("right") && { left: -6 }),
                    ...(placement.startsWith("left") && { right: -6 }),
                  }}
                />
              </Box>
            </Grow>
          )}
        </Popper>
      )}
    </>
  );
}
