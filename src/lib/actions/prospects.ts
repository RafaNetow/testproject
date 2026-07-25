"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export async function createProspect(formData: FormData) {
  await requireAxelAdmin();

  const companyName = String(formData.get("company_name") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const estimatedValue = Number(formData.get("estimated_value") ?? 0);
  if (!companyName) {
    throw new Error("Company name is required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("prospects").insert({
    company_name: companyName,
    contact_name: contactName || null,
    contact_email: contactEmail || null,
    estimated_value_cents: estimatedValue > 0 ? Math.round(estimatedValue * 100) : null,
  });
  if (error) {
    throw new Error(`Couldn't add prospect: ${error.message}`);
  }
  revalidatePath("/admin/prospects");
}

export async function updateProspectStage(prospectId: string, formData: FormData) {
  await requireAxelAdmin();
  const stage = String(formData.get("stage") ?? "lead");

  const supabase = await createClient();
  const { error } = await supabase.from("prospects").update({ stage }).eq("id", prospectId);
  if (error) {
    throw new Error(`Couldn't update prospect: ${error.message}`);
  }
  revalidatePath("/admin/prospects");
}

export async function deleteProspect(prospectId: string) {
  await requireAxelAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("prospects").delete().eq("id", prospectId);
  if (error) {
    throw new Error(`Couldn't delete prospect: ${error.message}`);
  }
  revalidatePath("/admin/prospects");
}

/** Creates the client org from a won prospect and takes admin straight to it. */
export async function convertProspectToClient(prospectId: string) {
  await requireAxelAdmin();
  const supabase = await createClient();

  const { data: prospect } = await supabase
    .from("prospects")
    .select("company_name")
    .eq("id", prospectId)
    .maybeSingle();
  if (!prospect) {
    throw new Error("Prospect not found.");
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: prospect.company_name, status: "onboarding" })
    .select("id")
    .single();
  if (orgError || !org) {
    throw new Error(`Couldn't create client: ${orgError?.message ?? "unknown error"}`);
  }

  const { error: stageError } = await supabase
    .from("prospects")
    .update({ stage: "won" })
    .eq("id", prospectId);
  if (stageError) {
    throw new Error(`Client created, but couldn't update prospect stage: ${stageError.message}`);
  }

  revalidatePath("/admin/prospects");
  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${org.id}`);
}
