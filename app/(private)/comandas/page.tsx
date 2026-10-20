import { requirePermission } from "@/lib/auth/current";
export default async function ComandasPage() { await requirePermission("comandas"); return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-4xl font-bold">Comandas</h1><p className="mt-4 text-stone-600">Panel de comandas en preparación.</p></main>; }
