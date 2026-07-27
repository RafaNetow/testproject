import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FALLBACK_ERROR =
  "We couldn't send your message right now — please email hello@alchemica.dk directly.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.name !== "string" ||
    !body.name.trim() ||
    typeof body.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ||
    typeof body.message !== "string" ||
    !body.message.trim()
  ) {
    return NextResponse.json(
      { ok: false, error: "Please fill in your name, a valid email, and a message." },
      { status: 400 }
    );
  }

  if (!resend) {
    console.error("Contact form submitted but RESEND_API_KEY is not configured.");
    return NextResponse.json({ ok: false, error: FALLBACK_ERROR }, { status: 500 });
  }

  const name = body.name.trim();
  const email = body.email.trim();
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const message = body.message.trim();

  try {
    const { error } = await resend.emails.send({
      from: "Alchemica <hello@alchemica.dk>",
      to: process.env.CONTACT_TO_EMAIL || "hello@alchemica.dk",
      replyTo: email,
      subject: `New enquiry from ${name}${company ? ` (${company})` : ""}`,
      text: `Name: ${name}\nEmail: ${email}\nCompany: ${company || "—"}\n\n${message}`,
    });

    if (error) {
      console.error("Resend send failed:", error);
      return NextResponse.json({ ok: false, error: FALLBACK_ERROR }, { status: 500 });
    }
  } catch (err) {
    console.error("Resend send failed:", err);
    return NextResponse.json({ ok: false, error: FALLBACK_ERROR }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
