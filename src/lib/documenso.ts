import "server-only";

const BASE_URL = "https://app.documenso.com/api/v2";

function apiKey() {
  const key = process.env.DOCUMENSO_API_KEY;
  if (!key) throw new Error("DOCUMENSO_API_KEY is not configured.");
  return key;
}

async function documensoFetch(path: string, init: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { Authorization: apiKey(), ...init.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Documenso API error (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}

export type CreateEnvelopeResult = { id: string };

/** Creates an envelope (document) with one PDF and one signer, ready to send. */
export async function createEnvelope({
  title,
  externalId,
  file,
  recipientName,
  recipientEmail,
  subject,
  message,
}: {
  title: string;
  externalId: string;
  file: File;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  message: string;
}): Promise<CreateEnvelopeResult> {
  const payload = {
    type: "DOCUMENT",
    title,
    externalId,
    recipients: [
      {
        email: recipientEmail,
        name: recipientName,
        role: "SIGNER",
        fields: [
          {
            identifier: 0,
            type: "SIGNATURE",
            page: 1,
            positionX: 65,
            positionY: 85,
            width: 25,
            height: 6,
          },
          {
            identifier: 0,
            type: "DATE",
            page: 1,
            positionX: 65,
            positionY: 92,
            width: 20,
            height: 4,
          },
        ],
      },
    ],
    meta: { subject, message },
  };

  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  form.append("files", file);

  return documensoFetch("/envelope/create", { method: "POST", body: form });
}

export type DistributeResult = {
  success: boolean;
  id: string;
  recipients: { email: string; signingUrl: string }[];
};

/** Sends a draft envelope to its recipients, moving it from DRAFT to PENDING. */
export async function distributeEnvelope(envelopeId: string): Promise<DistributeResult> {
  return documensoFetch("/envelope/distribute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ envelopeId }),
  });
}

export type EnvelopeItem = { id: string; title: string; order: number };

/** Fetches an envelope's current state, including its PDF file references. */
export async function getEnvelope(
  envelopeId: string
): Promise<{ id: string; status: string; envelopeItems: EnvelopeItem[] }> {
  return documensoFetch(`/envelope/${envelopeId}`, { method: "GET" });
}

/** Downloads a completed (signed) PDF as raw bytes. */
export async function downloadEnvelopeItem(envelopeItemId: string): Promise<ArrayBuffer> {
  const res = await fetch(`${BASE_URL}/envelope/item/${envelopeItemId}/download`, {
    headers: { Authorization: apiKey() },
  });
  if (!res.ok) {
    throw new Error(`Documenso download error (${res.status}): ${res.statusText}`);
  }
  return res.arrayBuffer();
}
