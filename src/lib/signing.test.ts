import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { sha256Hex, stampCertificate } from "./signing";

async function samplePdf(pages = 2) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([595, 842]).drawText(`Page ${i + 1}`, { x: 50, y: 780 });
  return doc.save();
}

describe("sha256Hex", () => {
  it("matches the known digest of 'abc'", () => {
    expect(sha256Hex(new TextEncoder().encode("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("stampCertificate", () => {
  const input = {
    contractId: "00000000-0000-0000-0000-000000000099",
    title: "Mutual NDA — Nordic Polymers",
    signerName: "Søren Åkesson 山",
    signerAccount: "owner@cliente.test",
    signedAt: new Date("2026-10-16T14:32:05.123Z"),
    ip: "203.0.113.7",
    userAgent: "Mozilla/5.0 (test)",
    hash: "a".repeat(64),
  };

  it("keeps the original pages and appends one certificate page", async () => {
    const original = await samplePdf(2);
    const stamped = await stampCertificate(original, input);
    const doc = await PDFDocument.load(stamped);
    expect(doc.getPageCount()).toBe(3);
  });

  it("copes with names outside Latin-1 and very long values", async () => {
    const original = await samplePdf(1);
    const stamped = await stampCertificate(original, { ...input, userAgent: "x".repeat(400), title: "T".repeat(300) });
    expect((await PDFDocument.load(stamped)).getPageCount()).toBe(2);
  });
});
