import { completeSignIn } from "./actions";

/**
 * Landing target for the magic-link email. Deliberately does nothing on
 * page load — see actions.ts for why verification is gated behind an
 * explicit click rather than running as soon as this page is reached.
 */
export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{
    token_hash?: string;
    type?: string;
    code?: string;
    next?: string;
  }>;
}) {
  const { token_hash, type, code, next } = await searchParams;
  const confirmSignIn = completeSignIn.bind(null, { tokenHash: token_hash, type, code, next });

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">Sign in</p>
        <h1 className="mt-3 font-display text-xl font-medium text-primary">
          Finish signing in
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          For security, we need one more click from you directly — some email
          apps open links automatically before you do.
        </p>
        <form action={confirmSignIn} className="mt-6">
          <button
            type="submit"
            className="btn-primary w-full rounded-full px-5 py-3 text-sm font-medium"
          >
            Finish signing in
          </button>
        </form>
      </div>
    </main>
  );
}
