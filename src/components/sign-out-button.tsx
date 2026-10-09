"use client";

import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ tone = "light" }: { tone?: "light" | "dark" }) {
  const router = useRouter();

  async function onClick() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      onClick={onClick}
      variant={tone === "dark" ? "text" : "outlined"}
      color="secondary"
      sx={
        tone === "dark"
          ? { mt: 0.5, px: 0, minWidth: 0, color: "rgba(255,255,255,0.4)", "&:hover": { color: "#fff", bgcolor: "transparent" } }
          : undefined
      }
    >
      Sign out
    </Button>
  );
}
