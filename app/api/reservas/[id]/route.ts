import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Iniciá sesión." }, { status: 401 });
  if (!canAccess(session.user.role, "reservas")) return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
  const { id } = await params;
  const reserva = await prisma.reserva.findFirst({
    where: { id, ...(session.user.role === "ADMIN" ? {} : { creadaPorId: session.user.id }) },
    select: { id: true, clienteNombre: true, fechaHora: true, estado: true, creadaPorId: true },
  });
  if (!reserva) return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
  return NextResponse.json(reserva);
}
