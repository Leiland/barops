import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { authenticateCredentials } from "@/lib/auth/login";
import { createAuthSession, activeSession, revokeAuthSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword, validateNewPassword } from "@/lib/auth/password";

const email = "auth-" + randomUUID() + "@example.test";
const password = "river lantern orange mosaic 2026";
const request = () => new Request("http://localhost/login", { headers: { "x-real-ip": "192.0.2.44" } });
let userId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email, nombre: "Test Camarero", rol: "CAMARERO", passwordHash: await hashPassword(password), emailVerifiedAt: new Date() },
  });
  userId = user.id;
});
beforeEach(async () => {
  await prisma.authRateLimit.deleteMany();
  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date(), deletedAt: null } });
});
afterAll(async () => {
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("login y sesiones", () => {
  it("acepta credenciales correctas y crea una sesión válida", async () => {
    const result = await authenticateCredentials({ email, password }, request());
    expect(result?.id).toBe(userId);
    expect(await activeSession(result!.sessionId, userId)).toMatchObject({ id: userId });
  });

  it("rechaza contraseña errónea y no crea sesión", async () => {
    const before = await prisma.authSession.count({ where: { userId } });
    expect(await authenticateCredentials({ email, password: "incorrecta" }, request())).toBeNull();
    expect(await prisma.authSession.count({ where: { userId } })).toBe(before);
  });

  it("rechaza usuario inexistente con el mismo resultado", async () => {
    expect(await authenticateCredentials({ email: "nadie-" + randomUUID() + "@example.test", password }, request())).toBeNull();
  });

  it("rechaza usuario sin verificar y deshabilitado", async () => {
    await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: null } });
    expect(await authenticateCredentials({ email, password }, request())).toBeNull();
    await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date(), deletedAt: new Date() } });
    expect(await authenticateCredentials({ email, password }, request())).toBeNull();
  });

  it("limita intentos por cuenta", async () => {
    for (let i = 0; i < 5; i++) expect(await authenticateCredentials({ email, password: "mal" }, request())).toBeNull();
    expect(await authenticateCredentials({ email, password }, request())).toBeNull();
  });

  it("limita intentos por IP entre cuentas", async () => {
    for (let i = 0; i < 30; i++) {
      await authenticateCredentials({ email: "unknown-" + i + "@example.test", password: "mal" }, request());
    }
    expect(await authenticateCredentials({ email, password }, request())).toBeNull();
  });

  it("revoca el logout y rechaza sesiones vencidas", async () => {
    const sid = await createAuthSession(userId);
    await revokeAuthSession(sid);
    expect(await activeSession(sid, userId)).toBeNull();
    const expired = await createAuthSession(userId);
    const { createHash } = await import("node:crypto");
    await prisma.authSession.update({
      where: { id: createHash("sha256").update(expired).digest("hex") },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await activeSession(expired, userId)).toBeNull();
  });
});

describe("contraseñas", () => {
  it("genera hashes Argon2id distintos con parámetros OWASP", async () => {
    const a = await hashPassword(password);
    const b = await hashPassword(password);
    expect(a).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(a).not.toBe(b);
    expect(await verifyPassword(a, password)).toBe(true);
    expect(await verifyPassword(a, "otra")).toBe(false);
  });
  it("exige longitud y rechaza contraseñas comunes", () => {
    expect(validateNewPassword("corta")).toMatch(/15 y 128/);
    expect(validateNewPassword("passwordpasswordpassword")).toBeTruthy();
    expect(validateNewPassword("frigid meadow canvas otter 9751")).toBeNull();
  });
});
