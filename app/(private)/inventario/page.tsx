import { requirePermission } from "@/lib/auth/current";
export default async function InventarioPage() { await requirePermission("inventario"); return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-4xl font-bold">Inventario</h1><p className="mt-4 text-stone-600">Panel de inventario en preparación.</p></main>; }
