import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnvelope, downloadEnvelopeItem } from "@/lib/documenso";

const BUCKET = "org-documents";

function verifySecret(received: string | null) {
  const expected = process.env.DOCUMENSO_WEBHOOK_SECRET;
  if (!expected) return false;
  if (!received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!verifySecret(request.headers.get("x-documenso-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const event: string = body.event;
  const contractId: string | null = body.payload?.externalId ?? null;

  if (!contractId) {
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, org_id, project_id, documenso_document_id")
    .eq("id", contractId)
    .maybeSingle();
  if (!contract) {
    return NextResponse.json({ received: true });
  }

  if (event === "DOCUMENT_SENT") {
    await supabase.from("contracts").update({ signing_status: "sent" }).eq("id", contractId);
  } else if (event === "DOCUMENT_RECIPIENT_COMPLETED" || event === "DOCUMENT_SIGNED") {
    await supabase
      .from("contracts")
      .update({ signing_status: "partially_signed" })
      .eq("id", contractId)
      .neq("signing_status", "signed");
  } else if (event === "DOCUMENT_COMPLETED") {
    const envelopeId = contract.documenso_document_id;
    if (envelopeId) {
      try {
        const envelope = await getEnvelope(envelopeId);
        const firstItem = envelope.envelopeItems[0];
        if (firstItem) {
          const pdfBytes = await downloadEnvelopeItem(firstItem.id);
          const storagePath = `${contract.org_id}/contracts/${crypto.randomUUID()}-signed.pdf`;
          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, Buffer.from(pdfBytes), { contentType: "application/pdf" });
          if (!uploadError) {
            await supabase
              .from("contracts")
              .update({ signing_status: "signed", signed_pdf_storage_path: storagePath })
              .eq("id", contractId);
          }
        }
      } catch (err) {
        console.error("Documenso webhook: couldn't fetch/store signed PDF", err);
      }
    }
  }

  revalidatePath(`/admin/clients/${contract.org_id}/projects/${contract.project_id}/contracts`);
  revalidatePath("/portal/contracts");
  revalidatePath("/admin/contracts");

  return NextResponse.json({ received: true });
}
