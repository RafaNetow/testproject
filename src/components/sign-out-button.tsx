"use client";

import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import { createClient } from "@/lib/supabase/client";

export function useSignOut() {
  const router = useRouter();

  return async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };
}

export function SignOutButton() {
  const signOut = useSignOut();

  return (
    <Button onClick={signOut} variant="outlined" color="secondary">
      Sign out
    </Button>
  );
}
