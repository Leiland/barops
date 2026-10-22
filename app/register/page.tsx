import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/current";
import { dashboardPath } from "@/lib/auth/permissions";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const user = await currentUser();
  if (user) redirect(dashboardPath(user.role));
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-100 px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-8 shadow-xl shadow-orange-950/10 sm:p-10">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-orange-700">BarOps</p>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Crear cuenta</h1>
        <p className="mb-8 text-stone-600">Registrate con tu email y una contraseña segura.</p>
        <RegisterForm />
      </section>
    </main>
  );
}
