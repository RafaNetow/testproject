"use server";

import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Runs only when the user actually clicks "Finish signing in" — not on
 * page load. Corporate email scanners (Outlook Safe Links and similar)
 * pre-fetch every link in an incoming email to check it isn't malicious;
 * if verification ran on GET, that automated visit would consume the
 * single-use link before the real recipient ever clicked it. Gating the
 * actual verifyOtp/exchangeCodeForSession call behind a submitted form
 * means a scanner's plain GET request only ever renders the confirmation
 * page, never spends the token.
 */
export async function completeSignIn(params: {
  tokenHash?: string;
  type?: string;
  code?: string;
  next?: string;
}) {
  const { tokenHash, type, code, next } = params;
  const supabase = await createClient();
  let authenticated = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    authenticated = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authenticated = !error;
  }

  if (!authenticated) {
    redirect("/login?error=auth");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=auth");
  }

  // Only allow same-site relative paths — never redirect off-origin.
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .maybeSingle();

  redirect(profile?.platform_role === "axel_admin" ? "/admin" : "/portal");
}
