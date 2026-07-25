import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 renamed the middleware.ts file convention to proxy.ts (and
 * middleware() to proxy()) — see node_modules/next/dist/docs/.../proxy.md.
 * This is only the optimistic, cookie-based redirect layer. The real
 * enforcement is Postgres RLS + src/lib/dal.ts, called at every Server
 * Component/Action/Route Handler that touches tenant data.
 *
 * Scoped to /portal and /admin only (see matcher below) — the marketing
 * site must keep working even before Supabase env vars exist, so this never
 * touches Supabase for public routes.
 */
export async function proxy(request: NextRequest) {
  // Supabase isn't configured yet (Phase 0 — no project created, no
  // .env.local) — fail through to a clean 404 rather than crashing, since
  // /portal and /admin have no pages built yet either at this stage.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin") && !user) {
    // Full admin-role check happens in the DAL (requireAxelAdmin) once a
    // request reaches a Server Component — this layer only rules out
    // completely unauthenticated visitors, on purpose (see plan: obscurity
    // isn't the security boundary, platform_role is).
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (path.startsWith("/portal") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (path.startsWith("/invoices") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*", "/invoices/:path*"],
};
