"use server";

import { requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

/** Remembers that the signed-in person finished (or skipped) the welcome tour. */
export async function markTourDone() {
  const user = await requireSessionUser();
  const supabase = await createClient();
  // RLS: users may update their own profile row; only this column changes.
  await supabase.from("profiles").update({ tour_completed_at: new Date().toISOString() }).eq("id", user.id);
}
