import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current";

export default async function CocinaDashboard() {
  const user = await requireUser();
  if (user.role !== "COCINA") redirect("/unauthorized");
  return <main className="mx-auto max-w-6xl px-6 py-12"><p className="mb-2 text-sm font-semibold uppercase tracking-widest text-orange-700">Panel de cocina</p><h1 className="text-4xl font-bold">Hola, {user.name}</h1><p className="mt-4 text-stone-600">Tu panel está listo para incorporar las comandas de cocina.</p></main>;
}
