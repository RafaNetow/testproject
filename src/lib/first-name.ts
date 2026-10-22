import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The signed-in person's first name, for greetings: "Maja Owner" → "Maja",
 * "Axel (demo admin)" → "Axel". Undefined when the profile has no name.
 */
export async function firstName(supabase: SupabaseClient, userId: string): Promise<string | undefined> {
  const { data } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  const name = (data?.full_name as string | null | undefined)?.trim();
  return name ? name.split(/[\s(]/)[0] || undefined : undefined;
}
