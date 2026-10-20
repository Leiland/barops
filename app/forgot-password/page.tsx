import { ForgotForm } from "./forgot-form";

export default function ForgotPasswordPage() {
  return <main className="flex min-h-screen items-center justify-center bg-orange-50 px-4"><section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"><p className="mb-2 font-bold text-orange-700">BarOps</p><h1 className="mb-3 text-3xl font-bold">Recuperar contraseña</h1><p className="mb-8 text-stone-600">Te enviaremos un enlace si el email corresponde a una cuenta.</p><ForgotForm /></section></main>;
}
