import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">404</p>
      <h1 className="font-display text-2xl font-medium text-primary">
        This page doesn&apos;t exist.
      </h1>
      <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground">
        The link might be old, or the address was typed wrong.
      </p>
      <Link
        href="/"
        className="btn-primary mt-2 rounded-full px-5 py-2.5 text-sm font-medium"
      >
        Back to the homepage
      </Link>
    </div>
  );
}
