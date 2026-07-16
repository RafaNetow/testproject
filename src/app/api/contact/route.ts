import { NextResponse } from "next/server";

// TODO before launch: wire this up to a real email provider (e.g. Resend,
// Postmark, SendGrid) using an API key from an environment variable, and
// send the message to the studio inbox. Currently this only validates the
// payload — it does not deliver mail anywhere.
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

  return NextResponse.json({ ok: true });
}
