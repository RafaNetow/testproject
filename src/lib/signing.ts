import { createHash } from "node:crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Helpers for signing a contract inside the portal. The signed copy is the
 * original PDF plus one certificate page recording who signed, when, from
 * where, and the SHA-256 of the original — so anyone can later check that the
 * document that was signed is the document they hold.
 */

export function sha256Hex(bytes: Uint8Array | ArrayBuffer): string {
  return createHash("sha256").update(bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes).digest("hex");
}

// The built-in PDF fonts cover Latin-1 (æ, ø, å, é…); anything else becomes "?".
const safe = (text: string) => text.replace(/[^\x20-\x7E -ÿ]/g, "?");

export type CertificateInput = {
  contractId: string;
  title: string;
  signerName: string;
  signerAccount: string;
  signedAt: Date;
  ip: string;
  userAgent: string;
  hash: string;
};

/** Returns the original PDF with a signature-certificate page appended. */
export async function stampCertificate(original: Uint8Array | ArrayBuffer, c: CertificateInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(original, { ignoreEncryption: true });
  const page = pdf.addPage([595.28, 841.89]); // A4
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  const ink = rgb(0.09, 0.125, 0.118);
  const muted = rgb(0.29, 0.35, 0.34);
  const accent = rgb(0.184, 0.49, 0.427);
  const left = 56;
  let y = 770;

  page.drawRectangle({ x: 0, y: 808, width: 595.28, height: 34, color: accent });
  page.drawText("ALCHEMICA", { x: left, y: 820, size: 11, font: bold, color: rgb(1, 1, 1) });

  page.drawText("Electronic signature certificate", { x: left, y, size: 20, font: bold, color: ink });
  y -= 22;
  page.drawText(safe("This page records the electronic signature of the document it is attached to."), { x: left, y, size: 10, font: regular, color: muted });
  y -= 36;

  const row = (label: string, value: string, font = regular, size = 11) => {
    page.drawText(label.toUpperCase(), { x: left, y, size: 8, font: bold, color: muted });
    y -= 15;
    // Wrap long values (hash, user agent) at ~80 characters.
    const lines = safe(value).match(/.{1,80}/g) ?? [""];
    for (const line of lines) {
      page.drawText(line, { x: left, y, size, font, color: ink });
      y -= size + 4;
    }
    y -= 12;
  };

  row("Document", c.title, bold, 13);
  row("Signed by", c.signerName, bold, 13);
  row("Account", c.signerAccount);
  row("Signed at (UTC)", c.signedAt.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC"));
  row("IP address", c.ip);
  row("Browser", c.userAgent.slice(0, 160) || "unknown");
  row("Contract reference", c.contractId, mono, 9.5);
  row("SHA-256 of the original document", c.hash, mono, 9.5);

  y -= 4;
  page.drawLine({ start: { x: left, y }, end: { x: 595.28 - left, y }, thickness: 0.5, color: rgb(0.8, 0.84, 0.83) });
  y -= 22;
  const notice =
    "The signer reviewed the document in the Alchemica portal, typed their full name and confirmed that they agree to be bound by it. " +
    "Typing their name and confirming is their electronic signature. The fingerprint above is calculated from the original PDF as it was sent for signature; " +
    "if even one character of that file changes, the fingerprint no longer matches.";
  for (const line of safe(notice).match(/.{1,92}(\s|$)/g) ?? []) {
    page.drawText(line.trim(), { x: left, y, size: 9.5, font: regular, color: muted });
    y -= 14;
  }

  return pdf.save();
}
