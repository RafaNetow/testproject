"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { MolecularAccent } from "@/components/molecular-accent";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

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
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <main className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <MolecularAccent className="absolute inset-0 h-full w-full opacity-70" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link href="/" className="font-display text-xl tracking-tight text-white">
            Alchemica
          </Link>
          <p className="max-w-sm text-balance font-display text-3xl font-medium leading-tight text-white">
            One place for the work, instead of scattered across email.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft size={16} />
            Back to site
          </Link>

          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
            Sign in
          </p>
          <h1 className="mt-3 text-balance font-display text-3xl font-medium leading-tight text-primary">
            Client &amp; admin login
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Enter your email and we&apos;ll send a one-time link — no password
            to remember.
          </p>

          {status === "sent" ? (
            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-medium text-primary">
                Check your inbox
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                We sent a sign-in link to <strong>{email}</strong>. Open it on
                this device to continue.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
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
                className="rounded-full border border-border bg-card px-5 py-3.5 text-sm text-primary outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="rounded-full bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send magic link"}
              </button>
              {status === "error" && (
                <p className="text-sm text-red-600">{errorMessage}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
