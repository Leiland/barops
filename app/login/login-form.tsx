"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export function LoginForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        redirect: false,
      });
      if (!result || result.error) {
        setError("Usuario o contraseña incorrectos.");
      } else {
        window.location.assign("/dashboard");
      }
    } catch {
      setError("No pudimos conectar con el servidor. Intentá nuevamente.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="email">Email</label>
        <input className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500" id="email" name="email" type="email" autoComplete="username" required maxLength={254} />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="password">Contraseña</label>
        <input className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
      <button className="w-full rounded-xl bg-orange-700 px-4 py-3 font-semibold text-white hover:bg-orange-800 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={pending}>{pending ? "Ingresando…" : "Ingresar"}</button>
      <Link className="block text-center text-sm text-orange-800 underline underline-offset-4" href="/register">Crear una cuenta</Link>
      <Link className="block text-center text-sm text-orange-800 underline underline-offset-4" href="/forgot-password">¿Olvidaste tu contraseña?</Link>
    </form>
  );
}
