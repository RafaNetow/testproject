/**
 * The welcome tour's steps, as plain data (shared/onboarding-tour.tsx draws
 * them). A step with a `target` spotlights the first *visible* element that
 * matches the selector; without one (or when the target is hidden, e.g. the
 * sidebar on a phone) it shows as a centred card. Copy is in English, like
 * the rest of the portal.
 */

export type TourIcon = "welcome" | "nav" | "summary" | "clock" | "todo" | "stages" | "deliverables" | "files" | "contracts" | "chat" | "bell" | "settings" | "clients" | "calendar" | "invoices" | "assistant" | "search" | "stats" | "done";

export type TourStep = {
  id: string;
  icon: TourIcon;
  title: string;
  body: string;
  target?: string;
  /** Where the card sits relative to the target. */
  placement?: "top" | "bottom" | "left" | "right";
};

export const CLIENT_TOUR: TourStep[] = [
  {
    id: "welcome",
    icon: "welcome",
    title: "Welcome to your Alchemica portal",
    body: "One place for your engagement with Alchemica: progress, deliverables, data, contracts and a direct line to Axel. This quick tour shows you around — it takes about a minute.",
  },
  {
    id: "nav",
    icon: "nav",
    target: 'nav[aria-label="Main"]',
    placement: "right",
    title: "Everything in one menu",
    body: "Board, deliverables, files, meetings, decisions, invoices and contracts. Each page shows your current project; switch projects at the top of a page.",
  },
  {
    id: "hero",
    icon: "summary",
    target: '[data-tour="summary-hero"]',
    placement: "bottom",
    title: "Where things stand",
    body: "The Executive Summary opens with the stage your project is in and how many things are waiting on you.",
  },
  {
    id: "countdowns",
    icon: "clock",
    target: '[data-tour="countdowns"]',
    placement: "bottom",
    title: "What's coming up",
    body: "Live countdowns to your next meeting — join it from here — and to the next deliverable or the end of the current stage.",
  },
  {
    id: "waiting",
    icon: "todo",
    // The header (title + ring), not the whole list.
    target: '[data-tour="waiting"] .MuiPaper-root > div:first-of-type',
    placement: "top",
    title: "What we need from you",
    body: "Answers, data, reviews and signatures, each with one button. Tap a colour in the ring to see only that kind.",
  },
  {
    id: "progress",
    icon: "stages",
    // The first project card, not every project.
    target: '[data-tour="progress"] > :first-child',
    placement: "top",
    title: "Progress, stage by stage",
    body: "Each project's progress and its stages on a timeline. Open a stage to see what happens in it and whether it's on time.",
  },
  {
    id: "deliverables",
    icon: "deliverables",
    target: 'nav[aria-label="Main"] a[href="/portal/deliverables"]',
    placement: "right",
    title: "Review and approve",
    body: "Reports and plans arrive in Deliverables. Approve them, or ask for changes with a note — Axel is told right away.",
  },
  {
    id: "files",
    icon: "files",
    target: 'nav[aria-label="Main"] a[href="/portal/files"]',
    placement: "right",
    title: "Share your data",
    body: "When Alchemica needs data, it appears as a request in Files. Upload straight into it and it lands in the right folder, labelled by technique.",
  },
  {
    id: "contracts",
    icon: "contracts",
    target: 'nav[aria-label="Main"] a[href="/portal/contracts"]',
    placement: "right",
    title: "Sign in the portal",
    body: "Contracts waiting for you can be read and signed here — no other account needed. You get a copy with a signature certificate.",
  },
  {
    id: "chat",
    icon: "chat",
    target: ".MuiFab-root",
    placement: "left",
    title: "Talk to Axel",
    body: "The bubble opens your conversation with Axel for this project. Messages arrive live, and you can attach files.",
  },
  {
    id: "bell",
    icon: "bell",
    target: 'button[aria-label^="Notifications"]',
    placement: "bottom",
    title: "Never miss a thing",
    body: "The bell lists every update on your projects as it happens. You can also get a short summary by email on Mondays.",
  },
  {
    id: "settings",
    icon: "settings",
    target: 'button[aria-label="Settings"]',
    placement: "bottom",
    title: "Make it yours",
    body: "The gear opens Settings: choose a colour, turn animations off, or take this tour again any time.",
  },
  {
    id: "done",
    icon: "done",
    title: "You're all set",
    body: "Start with what's waiting on you. If anything is unclear, ask Axel in the chat.",
  },
];

export const ADMIN_TOUR: TourStep[] = [
  {
    id: "welcome",
    icon: "welcome",
    title: "Welcome to Alchemica admin",
    body: "Run every client engagement from here: projects, deliverables, data requests, meetings, money and contracts. A one-minute tour.",
  },
  {
    id: "stats",
    icon: "stats",
    target: '[data-tour="dashboard-stats"]',
    placement: "bottom",
    title: "Your practice at a glance",
    body: "Active clients, projects and upcoming meetings. Below: quick links and everything that happened recently across clients.",
  },
  {
    id: "search",
    icon: "search",
    target: 'input[placeholder="Search everything…"]',
    placement: "bottom",
    title: "Find anything",
    body: "Search clients, projects, files, decisions and deliverables from any page.",
  },
  {
    id: "clients",
    icon: "clients",
    target: 'nav[aria-label="Main"] a[href="/admin/clients"]',
    placement: "right",
    title: "Clients and projects",
    body: "Each client shows its progress. Open one to set stages and dates, request data, publish deliverables and log hours.",
  },
  {
    id: "calendar",
    icon: "calendar",
    target: 'nav[aria-label="Main"] a[href="/admin/calendar"]',
    placement: "right",
    title: "One calendar for everyone",
    body: "Meetings, due dates, stages and invoices across every client, by month, week or agenda — in Copenhagen time.",
  },
  {
    id: "invoices",
    icon: "invoices",
    target: 'nav[aria-label="Main"] a[href="/admin/invoices"]',
    placement: "right",
    title: "Money in and out",
    body: "Paid, outstanding and overdue at a glance, with what's due soon. Invoices are created from each project.",
  },
  {
    id: "contracts",
    icon: "contracts",
    target: 'nav[aria-label="Main"] a[href="/admin/contracts"]',
    placement: "right",
    title: "Contracts",
    body: "Send an NDA or SOW for signature in the portal and follow each one to signed.",
  },
  {
    id: "assistant",
    icon: "assistant",
    target: 'nav[aria-label="Main"] a[href="/admin/assistant"]',
    placement: "right",
    title: "Your AI copilot",
    body: "It drafts replies to clients in your style and learns from your corrections and rules. Nothing is sent without you.",
  },
  {
    id: "chat",
    icon: "chat",
    target: ".MuiFab-root",
    placement: "left",
    title: "Every conversation",
    body: "The bubble lists every client conversation. Turn a message into a decision or a board card in one click.",
  },
  {
    id: "settings",
    icon: "settings",
    target: 'button[aria-label="Settings"]',
    placement: "bottom",
    title: "Settings",
    body: "Colours, animations, and this tour again whenever you want.",
  },
  {
    id: "done",
    icon: "done",
    title: "Ready when you are",
    body: "Clients see their own welcome tour the first time they sign in.",
  },
];
