import { after, NextResponse } from "next/server";
import { RECOVERY_MESSAGE, requestPasswordReset } from "@/lib/auth/recovery";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Ingresá un email válido." }, { status: 400 });
  }
  const email = typeof body === "object" && body !== null && "email" in body ? (body as { email: unknown }).email : null;
  if (typeof email !== "string" || !email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "Ingresá un email válido." }, { status: 400 });
  }
  const started = Date.now();
  try {
    await requestPasswordReset(email, request, (delivery) => after(delivery));
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, 500 - (Date.now() - started))));
    return NextResponse.json({ message: RECOVERY_MESSAGE });
  } catch (error) {
    console.error("Error de recuperación", error);
    return NextResponse.json({ error: "No pudimos procesar la solicitud. Intentá nuevamente." }, { status: 503 });
  }
}
