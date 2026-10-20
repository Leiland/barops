import { requirePermission } from "@/lib/auth/current";
export default async function ReservasPage() { await requirePermission("reservas"); return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-4xl font-bold">Reservas</h1><p className="mt-4 text-stone-600">Panel de reservas en preparación.</p></main>; }
