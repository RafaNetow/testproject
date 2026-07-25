"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "alchemica-cookie-notice-dismissed";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-6 py-4 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-sm leading-relaxed text-secondary">
          This site uses one strictly necessary cookie to keep you signed
          in — no tracking or analytics cookies.{" "}
          <a
            href="/privacy"
            className="text-accent underline underline-offset-2"
          >
            Read more
          </a>
          .
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="btn-primary shrink-0 rounded-full px-5 py-2 text-sm font-medium"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
