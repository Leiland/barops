import { ResetForm } from "./reset-form";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <main className="flex min-h-screen items-center justify-center bg-orange-50 px-4"><section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"><p className="mb-2 font-bold text-orange-700">BarOps</p><h1 className="mb-8 text-3xl font-bold">Nueva contraseña</h1><ResetForm token={token} /></section></main>;
}
