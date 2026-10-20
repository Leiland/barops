"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export function ForgotForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setMessage(""); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/password/forgot", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });
      const body = await response.json();
      if (!response.ok) setError(body.error ?? "No pudimos procesar la solicitud.");
      else setMessage(body.message);
    } catch {
      setError("No pudimos conectar con el servidor. Intentá nuevamente.");
    } finally { setPending(false); }
  }
  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="email">Email</label>
        <input className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3" id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
      </div>
      {message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-900" role="status">{message}</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
      <button className="w-full rounded-xl bg-orange-700 px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Enviando…" : "Enviar instrucciones"}</button>
      <Link className="block text-center text-sm text-orange-800 underline" href="/login">Volver al login</Link>
    </form>
  );
}
