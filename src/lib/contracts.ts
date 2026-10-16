import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "org-documents";

export const CONTRACT_COLUMNS =
  "id, title, contract_type, signing_status, signing_method, signed_pdf_storage_path, unsigned_pdf_storage_path, " +
  "documenso_document_id, documenso_signing_url, signer_name, signed_at, signature_hash";

export type ContractRow = {
  id: string;
  title: string;
  contract_type: string;
  signing_status: string;
  signing_method: string | null;
  signed_pdf_storage_path: string | null;
  unsigned_pdf_storage_path: string | null;
  documenso_document_id: string | null;
  documenso_signing_url: string | null;
  signer_name: string | null;
  signed_at: string | null;
  signature_hash: string | null;
};

/**
 * A project's contracts with short-lived links: the signed copy to download
 * and, while a portal-signed contract is waiting, the unsigned PDF to review.
 * Runs with the caller's session, so RLS decides who gets which rows and files.
 */
export async function loadContracts(supabase: SupabaseClient, projectId: string) {
  const { data } = await supabase
    .from("contracts")
    .select(CONTRACT_COLUMNS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as ContractRow[];
  const link = async (path: string | null) => {
    if (!path) return null;
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    return signed?.signedUrl ?? null;
  };

  return Promise.all(
    rows.map(async (c) => ({
      ...c,
      url: await link(c.signed_pdf_storage_path),
      reviewUrl: c.signing_status === "sent" && c.signing_method === "portal" ? await link(c.unsigned_pdf_storage_path) : null,
    }))
  );
}
