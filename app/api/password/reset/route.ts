import { NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth/recovery";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const data = body as { token?: unknown; password?: unknown };
  if (typeof data?.token !== "string" || typeof data?.password !== "string") {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  try {
    const error = await resetPassword(data.token, data.password, request);
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ message: "Contraseña actualizada. Ya podés iniciar sesión." });
  } catch (error) {
    console.error("Error al cambiar contraseña", error);
    return NextResponse.json({ error: "No pudimos cambiar la contraseña. Intentá nuevamente." }, { status: 503 });
  }
}
