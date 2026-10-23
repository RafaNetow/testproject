"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import Zoom from "@mui/material/Zoom";

const EVENT = "alchemica:success";

/**
 * Shows the success toast from anywhere (e.g. right after a server action
 * returns ok, before the page refreshes and the form unmounts).
 */
export function notifySuccess(message: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

/** A check mark that draws itself (stroke animation), for moments worth marking. */
export function AnimatedCheck({ size = 22 }: { size?: number }) {
  return (
    <Box component="svg" viewBox="0 0 24 24" aria-hidden sx={{ width: size, height: size, display: "block" }}>
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity={0.15} />
      <path className="check-draw" d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
    </Box>
  );
}

/**
 * The one success toast of the app shell: an MUI Snackbar that zooms in at
 * the bottom left (the chat bubble owns the bottom right), with a check that
 * draws itself.
 */
export function SuccessToaster() {
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onSuccess = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail);
      setOpen(true);
    };
    window.addEventListener(EVENT, onSuccess);
    return () => window.removeEventListener(EVENT, onSuccess);
  }, []);

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={(_, reason) => reason !== "clickaway" && setOpen(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      slots={{ transition: Zoom }}
    >
      <Alert
        role="status"
        severity="success"
        variant="filled"
        icon={<AnimatedCheck />}
        onClose={() => setOpen(false)}
        sx={{ alignItems: "center", bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 600, boxShadow: "var(--shadow-dropdown)" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
