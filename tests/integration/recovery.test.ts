import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createAuthSession, activeSession } from "@/lib/auth/session";
import { authenticateCredentials } from "@/lib/auth/login";

const sendMail = vi.hoisted(() => vi.fn());
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail }) } }));
vi.mock("next/server", () => ({
  after: (task: () => Promise<void>) => { void task(); },
  NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) },
}));

import { requestPasswordReset, resetPassword } from "@/lib/auth/recovery";
import { POST as forgotRoute } from "@/app/api/password/forgot/route";

const email = "recover-" + randomUUID() + "@example.test";
const oldPassword = "marble basket violet thunder 2026";
const newPassword = "harbor velvet lantern meadow 2027";
const request = () => new Request("http://localhost/api/password/forgot", { headers: { "x-real-ip": "192.0.2.55" } });
let userId: string;

function emailedToken(): string {
  const body = String(sendMail.mock.calls.at(-1)?.[0]?.text ?? "");
  const match = body.match(/token=([A-Za-z0-9_-]{43})/);
  if (!match) throw new Error("No llegó un enlace de recuperación");
  return match[1];
}

beforeAll(async () => {
  process.env.SMTP_HOST = "smtp.example.test";
  process.env.SMTP_FROM = "BarOps <noreply@example.test>";
  const user = await prisma.user.create({
    data: { email, nombre: "Recovery", rol: "CAMARERO", passwordHash: await hashPassword(oldPassword), emailVerifiedAt: new Date() },
  });
  userId = user.id;
});
beforeEach(async () => {
  sendMail.mockReset().mockResolvedValue({});
  await prisma.authRateLimit.deleteMany();
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(oldPassword) } });
});
afterAll(async () => {
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("recuperación de contraseñas", () => {
  it("responde igual si el email existe o no", async () => {
    const existing = await forgotRoute(new Request("http://localhost/api/password/forgot", { method: "POST", headers: { "Content-Type": "application/json", "x-real-ip": "192.0.2.55" }, body: JSON.stringify({ email }) }));
    const missing = await forgotRoute(new Request("http://localhost/api/password/forgot", { method: "POST", headers: { "Content-Type": "application/json", "x-real-ip": "192.0.2.55" }, body: JSON.stringify({ email: "missing@example.test" }) }));
    expect(existing.status).toBe(200);
    expect(missing.status).toBe(200);
    expect(await existing.json()).toEqual(await missing.json());
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it("guarda solo el hash del token y permite usarlo una vez", async () => {
    const sessionId = await createAuthSession(userId);
    await requestPasswordReset(email, request());
    const token = emailedToken();
    const stored = await prisma.passwordResetToken.findFirstOrThrow({ where: { userId } });
    expect(stored.tokenHash).not.toContain(token);
    expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(await resetPassword(token, newPassword, request())).toBeNull();
    expect(await resetPassword(token, newPassword, request())).toMatch(/no es válido/);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(await verifyPassword(user.passwordHash!, newPassword)).toBe(true);
    expect(await verifyPassword(user.passwordHash!, oldPassword)).toBe(false);
    expect(await authenticateCredentials({ email, password: oldPassword }, request())).toBeNull();
    expect(await authenticateCredentials({ email, password: newPassword }, request())).not.toBeNull();
    expect(await activeSession(sessionId, userId)).toBeNull();
  });

  it("rechaza tokens inválidos y vencidos", async () => {
    expect(await resetPassword("mal", newPassword, request())).toMatch(/no es válido/);
    await requestPasswordReset(email, request());
    const token = emailedToken();
    await prisma.passwordResetToken.updateMany({ where: { userId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await resetPassword(token, newPassword, request())).toMatch(/no es válido/);
  });

  it("limita solicitudes de recuperación por cuenta", async () => {
    for (let i = 0; i < 4; i++) await requestPasswordReset(email, request());
    expect(sendMail).toHaveBeenCalledTimes(3);
  });
});
