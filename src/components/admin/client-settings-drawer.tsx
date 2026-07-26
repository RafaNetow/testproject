"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { GearSix, X } from "@phosphor-icons/react/dist/ssr";

/**
 * Slide-over panel for everything that isn't "look at the client's active
 * work": editing the client record, managing team invites, and the
 * delete-client action. Keeps the main page focused on projects/engagements
 * — the thing an admin actually opens this page to see.
 */
export function ClientSettingsDrawer({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function onCancel(e: Event) {
      // Let Escape close it via the native <dialog> behavior — nothing to do,
      // just avoid the default "cancel" firing twice with our own handlers.
      e.stopPropagation();
    }
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        title="Client settings"
        aria-label="Open client settings"
      >
        <GearSix size={17} />
      </button>

      <dialog
        ref={dialogRef}
        className="client-settings-drawer m-0 ml-auto h-dvh max-h-dvh w-full max-w-md bg-card p-0 backdrop:bg-black/50"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogRef.current?.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <p className="font-display text-lg font-medium text-primary">Client settings</p>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
              aria-label="Close settings"
            >
              <X size={17} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        </div>
      </dialog>
    </>
  );
}
