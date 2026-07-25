"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

/**
 * Lets a client's own "owner" role update their org's CVR number and
 * billing address — required on a compliant Danish invoice. Gated by the
 * "owners update own org" RLS policy (organizations), not an app-level
 * admin check, since this is meant to be self-service for the client.
 */
export async function updateOrgDetails(orgId: string, formData: FormData) {
  await requireSessionUser();

  const cvrNumber = String(formData.get("cvr_number") ?? "").trim();
  const billingAddress = String(formData.get("billing_address") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      cvr_number: cvrNumber || null,
      billing_address: billingAddress || null,
    })
    .eq("id", orgId);
  if (error) {
    throw new Error(`Couldn't save company details: ${error.message}`);
  }
  revalidatePath("/portal/team");
}
