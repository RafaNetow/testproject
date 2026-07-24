import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { MolecularAccent } from "@/components/molecular-accent";
import { LoginForm } from "./login-form";

/**
 * Server component so an already-authenticated visitor never sees the
 * login form — they're routed straight to the right surface by role.
 */
export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("platform_role")
      .eq("id", user.id)
      .maybeSingle();

    redirect(profile?.platform_role === "axel_admin" ? "/admin" : "/portal");
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

      <div className="flex items-center justify-center px-6 py-16 sm:py-24">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:mb-10"
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

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
