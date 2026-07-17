"use server";

import { revalidatePath } from "next/cache";
import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export async function createOrganization(formData: FormData) {
  await requireAxelAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("organizations").insert({ name, status: "onboarding" });

  revalidatePath("/admin/clients");
  revalidatePath("/admin");
}
