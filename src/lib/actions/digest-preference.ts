"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

/** The signed-in user's own Monday-email preference (via set_weekly_digest, migration 0021). */
export async function setWeeklyDigest(enabled: boolean) {
  await requireSessionUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_weekly_digest", { p_enabled: enabled });
  if (error) throw new Error(`Couldn't save your email preference: ${error.message}`);
  revalidatePath("/portal/team");
}
