import Link from "next/link";
import { requireUser } from "@/lib/auth/current";
import { canAccess, dashboardPath, type Resource } from "@/lib/auth/permissions";
import { LogoutButton } from "@/components/auth/logout-button";

const sections: { label: string; href: string; resource: Resource }[] = [
  { label: "Reservas", href: "/reservas", resource: "reservas" },
  { label: "Comandas", href: "/comandas", resource: "comandas" },
  { label: "TPV", href: "/tpv", resource: "tpv" },
  { label: "Inventario", href: "/inventario", resource: "inventario" },
];

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link className="text-xl font-bold text-orange-800" href={dashboardPath(user.role)}>BarOps</Link>
          <nav aria-label="Secciones" className="flex flex-wrap gap-4 text-sm">
            {sections.filter((item) => canAccess(user.role, item.resource)).map((item) =>
              <Link className="hover:text-orange-700" href={item.href} key={item.href}>{item.label}</Link>)}
          </nav>
          <div className="flex items-center gap-4"><span className="text-sm text-stone-600">{user.name}</span><LogoutButton /></div>
        </div>
      </header>
      {children}
    </div>
  );
}
