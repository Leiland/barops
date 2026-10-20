"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  return <button className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium disabled:opacity-60" type="button" disabled={pending} onClick={async () => {
    setPending(true);
    try { await signOut({ callbackUrl: "/login" }); }
    catch { setPending(false); }
  }}>{pending ? "Saliendo…" : "Cerrar sesión"}</button>;
}
