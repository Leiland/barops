import Image from "next/image";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-10 px-6 py-12 text-center md:flex-row md:text-left">
      <div className="max-w-md space-y-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">BarOps · Acceso restringido</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Esta cocina tiene acceso reservado</h1>
        <p className="text-lg text-muted-foreground">Tu cuenta no tiene permiso para entrar a esta sección. Volvé a tu panel o pedile acceso a un administrador.</p>
        <Link className="inline-flex rounded-lg bg-foreground px-5 py-3 font-medium text-background focus-visible:outline-2 focus-visible:outline-offset-2" href="/dashboard">Volver a mi panel</Link>
      </div>
      <Image className="w-full max-w-md rounded-3xl shadow-xl" src="/unauthorized-chef.png" alt="Un mapache chef protege con humor la entrada a la cocina" width={1254} height={1254} priority />
    </main>
  );
}
