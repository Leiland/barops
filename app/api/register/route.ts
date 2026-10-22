import { NextResponse } from "next/server";
import { registerUser, RegistrationError } from "@/lib/auth/register";

export const runtime = "nodejs";

function hasRoleAttribute(value: Record<string, unknown>): boolean {
  return Object.prototype.hasOwnProperty.call(value, "role") || Object.prototype.hasOwnProperty.call(value, "rol");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;
  if (hasRoleAttribute(payload)) {
    return NextResponse.json({ error: "El rol no se puede asignar durante el registro." }, { status: 400 });
  }
  if (typeof payload.email !== "string" || typeof payload.password !== "string") {
    return NextResponse.json({ error: "Email y contraseña son obligatorios." }, { status: 400 });
  }

  try {
    await registerUser({ email: payload.email, password: payload.password });
    return NextResponse.json({ message: "Cuenta creada correctamente." }, { status: 201 });
  } catch (error) {
    if (error instanceof RegistrationError) {
      return NextResponse.json({ error: error.message }, { status: error.code === "EMAIL_TAKEN" ? 409 : 400 });
    }
    console.error("Error al registrar usuario", error);
    return NextResponse.json({ error: "No pudimos crear la cuenta. Intentá nuevamente." }, { status: 500 });
  }
}
