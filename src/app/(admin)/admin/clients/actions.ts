"use server";

import { revalidatePath } from "next/cache";
import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { recordActivity, quoted } from "@/lib/activity";

export async function createOrganization(formData: FormData) {
  await requireAxelAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .insert({ name, status: "onboarding" })
    .select("id")
    .single();
  if (org) {
    await recordActivity({ kind: "client", orgId: org.id, message: `added the client ${quoted(name)}`, adminsOnly: true });
  }

  revalidatePath("/admin/clients");
  revalidatePath("/admin");
}
