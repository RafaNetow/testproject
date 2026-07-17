import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link landing target. Exchanges the PKCE code for a session, then
 * routes by role — this is the one place "admin vs client" gets decided,
 * so the login form itself stays a single shared page for both.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("platform_role")
          .eq("id", user.id)
          .maybeSingle();

        const dest = profile?.platform_role === "axel_admin" ? "/admin" : "/portal";
        return NextResponse.redirect(`${origin}${dest}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
