"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { normalizeEmail, validateEmail } from "@/lib/auth/registration-validation";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const credentials = {
      email: normalizeEmail(String(form.get("email") ?? "")),
      password: String(form.get("password") ?? ""),
    };
    const emailError = validateEmail(credentials.email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setPending(true);
    try {
      const { validateNewPassword } = await import("@/lib/auth/password-policy");
      const passwordError = validateNewPassword(credentials.password, credentials.email);
      if (passwordError) {
        setError(passwordError);
        return;
      }
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const body = await response.json();
      if (!response.ok) setError(body.error ?? "No pudimos crear la cuenta.");
      else router.push("/login?registered=1");
    } catch {
      setError("No pudimos conectar con el servidor. Intentá nuevamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="email">Email</label>
        <input className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500" id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="password">Contraseña</label>
        <input className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500" id="password" name="password" type="password" autoComplete="new-password" required minLength={15} maxLength={128} aria-describedby="password-help" />
        <p className="text-sm text-stone-600" id="password-help">Usá entre 15 y 128 caracteres y evitá contraseñas comunes o fáciles de adivinar.</p>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
      <button className="w-full rounded-xl bg-orange-700 px-4 py-3 font-semibold text-white hover:bg-orange-800 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={pending}>{pending ? "Creando cuenta…" : "Crear cuenta"}</button>
      <Link className="block text-center text-sm text-orange-800 underline underline-offset-4" href="/login">Ya tengo una cuenta</Link>
    </form>
  );
}
