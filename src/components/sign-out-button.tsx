"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function onClick() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        className ??
        "rounded-full border border-border px-5 py-2.5 text-sm font-medium text-secondary transition-colors hover:border-primary hover:text-primary"
      }
    >
      Sign out
    </button>
  );
}
