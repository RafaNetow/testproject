import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link landing target, and the one place "admin vs client" gets
 * decided so the login form stays a single shared page for both.
 *
 * Supports two verification modes:
 * - `?token_hash=...&type=email` — Supabase's cross-device flow (works even
 *   when the email link opens in a different browser than the one that
 *   requested it, e.g. a phone mail app's in-app browser).
 * - `?code=...` — the PKCE flow, which requires the same browser that
 *   initiated sign-in (its stored code verifier completes the exchange).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const supabase = await createClient();
  let authenticated = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    authenticated = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authenticated = !error;
  }

  if (authenticated) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Only allow same-site relative paths — never redirect off-origin.
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("platform_role")
        .eq("id", user.id)
        .maybeSingle();

      const dest = profile?.platform_role === "axel_admin" ? "/admin" : "/portal";
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
