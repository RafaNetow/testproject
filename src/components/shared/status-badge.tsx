const DOT_COLORS: Record<string, string> = {
  onboarding: "bg-sky-400",
  active: "bg-emerald-400",
  at_risk: "bg-amber-400",
  offboarded: "bg-slate-400",
  paused: "bg-amber-400",
  completed: "bg-slate-400",
  sent: "bg-sky-400",
  draft: "bg-slate-400",
  in_progress: "bg-sky-400",
  in_review: "bg-amber-400",
  changes_requested: "bg-orange-400",
  approved: "bg-emerald-400",
  overdue: "bg-red-400",
  paid: "bg-emerald-400",
  signed: "bg-emerald-400",
  partially_signed: "bg-amber-400",
  upcoming: "bg-sky-400",
  past: "bg-slate-400",
  cancelled: "bg-red-400",
};

/**
 * A dot + label pill — the pattern used by Linear/Vercel/Stripe-style
 * dashboards — instead of a flat tinted-background pill, which reads as
 * dated/"Bootstrap-y" and relies on color alone to carry meaning.
 */
export function StatusBadge({
  status,
  label,
  tone = "light",
}: {
  status: string;
  label?: string;
  tone?: "light" | "dark";
}) {
  const dot = DOT_COLORS[status] ?? "bg-slate-400";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider ${
        tone === "dark"
          ? "border-white/15 bg-white/5 text-white/80"
          : "border-border bg-card text-secondary"
      }`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {(label ?? status).replace("_", " ")}
    </span>
  );
}
