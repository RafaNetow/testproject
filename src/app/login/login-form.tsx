"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

const GENERIC_SEND_ERROR =
  "We couldn't send the sign-in link right now. Please try again in a moment.";

/** Supabase's client sometimes surfaces a network/API failure as an empty
 * or raw-JSON message (e.g. "{}") rather than a real sentence — fall back
 * to something readable instead of showing that to the user. */
function readableAuthError(message: string | undefined) {
  const trimmed = (message ?? "").trim();
  if (!trimmed || trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return GENERIC_SEND_ERROR;
  }
  return trimmed;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Surface a failed magic-link verification (the callback bounces back
  // here with ?error=auth) — previously this was silently swallowed.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "auth") {
      setStatus("error");
      setErrorMessage(
        "That sign-in link didn't work — it may have expired or been opened in a different browser. Request a fresh one below."
      );
      window.history.replaceState(null, "", "/login");
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(readableAuthError(error.message));
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm font-medium text-primary">Check your inbox</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We sent a sign-in link to <strong>{email}</strong>. For the smoothest
          sign-in, open it on this device. If it doesn&apos;t arrive within a
          minute, check your spam folder.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 inline-block py-2 text-sm font-medium text-accent transition-colors hover:text-primary"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
      {status === "error" && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm leading-relaxed text-destructive"
        >
          {errorMessage}
        </p>
      )}
      <label htmlFor="email" className="sr-only">
        Email address
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-full border border-border bg-card px-5 py-3.5 text-base text-primary outline-none transition-colors placeholder:text-muted-foreground focus:border-accent sm:text-sm"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-primary rounded-full px-5 py-3.5 text-sm font-medium disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send magic link"}
      </button>
    </form>
  );
}
