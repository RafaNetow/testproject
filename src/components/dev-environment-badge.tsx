/**
 * Development-only marker showing which Supabase the dev server is talking
 * to, so a local session is never mistaken for production (or vice versa).
 * Renders nothing in production builds.
 */
export function DevEnvironmentBadge() {
  if (process.env.NODE_ENV !== "development") return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url);

  return (
    <div
      role="status"
      className={`pointer-events-none fixed bottom-3 right-3 z-[100] rounded-full px-3 py-1 text-xs font-semibold shadow-md ${
        isLocal ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
      }`}
    >
      {isLocal ? "Local DB" : "Production DB"}
    </div>
  );
}
