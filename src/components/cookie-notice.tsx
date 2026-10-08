"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "alchemica-cookie-notice-dismissed";
const CHANGE_EVENT = "alchemica-cookie-notice-change";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// Fallback for when localStorage is blocked, so "Got it" still hides the notice.
let dismissedInMemory = false;

function isDismissed() {
  if (dismissedInMemory) return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function CookieNotice() {
  // Server render assumes "dismissed" so the notice never flashes in and out
  // during hydration; the client snapshot then shows it if it's still needed.
  const dismissed = useSyncExternalStore(subscribe, isDismissed, () => true);

  function dismiss() {
    dismissedInMemory = true;
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Storage blocked — dismissedInMemory covers the rest of this visit.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-4 bottom-4 z-50 flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-[0_8px_24px_rgb(15_23_42/0.12)] sm:left-6 sm:right-auto sm:max-w-md"
    >
      <p className="text-[13px] leading-snug text-secondary">
        This site uses one strictly necessary cookie to keep you signed
        in — no tracking or analytics cookies.{" "}
        <a href="/privacy" className="text-accent underline underline-offset-2">
          Read more
        </a>
        .
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="btn-primary shrink-0 rounded-full px-4 py-2 text-sm font-medium"
      >
        Got it
      </button>
    </div>
  );
}
