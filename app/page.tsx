import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        BarOps
      </p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Tu operación, en un solo lugar.
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        El proyecto ya está listo para construir mesas, reservas, comandas,
        TPV, inventario y métricas.
      </p>
      <div>
        <Link className="inline-flex rounded-lg bg-orange-700 px-5 py-3 font-semibold text-white hover:bg-orange-800" href="/login">Ingresar</Link>
      </div>
    </main>
  );
}
