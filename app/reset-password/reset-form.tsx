"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export function ResetForm({ token }: { token: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== form.get("confirm")) { setError("Las contraseñas no coinciden."); return; }
    setPending(true);
    try {
      const response = await fetch("/api/password/reset", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await response.json();
      if (!response.ok) setError(body.error ?? "No pudimos cambiar la contraseña.");
      else setMessage(body.message);
    } catch {
      setError("No pudimos conectar con el servidor. Intentá nuevamente.");
    } finally { setPending(false); }
  }
  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="space-y-2"><label className="block text-sm font-medium" htmlFor="password">Nueva contraseña</label><input className="w-full rounded-xl border border-stone-300 px-4 py-3" id="password" name="password" type="password" autoComplete="new-password" minLength={15} required /></div>
      <div className="space-y-2"><label className="block text-sm font-medium" htmlFor="confirm">Repetí la contraseña</label><input className="w-full rounded-xl border border-stone-300 px-4 py-3" id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={15} required /></div>
      <p className="text-sm text-stone-600">Usá entre 15 y 128 caracteres. Podés usar espacios; evitá contraseñas comunes.</p>
      {message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-900" role="status">{message}</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
      <button className="w-full rounded-xl bg-orange-700 px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={pending || !!message} type="submit">{pending ? "Guardando…" : "Cambiar contraseña"}</button>
      <Link className="block text-center text-sm text-orange-800 underline" href="/login">Ir al login</Link>
    </form>
  );
}
