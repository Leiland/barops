import { afterAll, afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { POST } from "@/app/api/register/route";

const prefix = "register-" + randomUUID();
const password = "Q7!mZ2@pL9#vX4$";

function request(payload: unknown) {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("registro público", () => {
  it("crea un camarero con una contraseña de 15 caracteres hasheada", async () => {
    const email = prefix + "-ok@example.test";
    const response = await POST(request({ email, password }));

    expect(response.status).toBe(201);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.rol).toBe("CAMARERO");
    expect(user.passwordHash).not.toBe(password);
    expect(await verifyPassword(user.passwordHash!, password)).toBe(true);
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it("responde 409 si el email ya existe", async () => {
    const email = prefix + "-duplicate@example.test";
    expect((await POST(request({ email, password }))).status).toBe(201);
    const response = await POST(request({ email: email.toUpperCase(), password }));

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: expect.stringMatching(/ya existe/i) });
    expect(await prisma.user.count({ where: { email } })).toBe(1);
  });

  it("rechaza contraseñas fuera del rango permitido", async () => {
    const short = await POST(request({ email: prefix + "-short@example.test", password: "muy-corta" }));
    const long = await POST(request({ email: prefix + "-long@example.test", password: "x".repeat(129) }));

    expect(short.status).toBe(400);
    expect(long.status).toBe(400);
    expect(await prisma.user.count({ where: { email: { startsWith: prefix } } })).toBe(0);
  });

  it("rechaza payloads que intentan asignar un rol", async () => {
    const roleResponse = await POST(request({ email: prefix + "-role@example.test", password, role: "ADMIN" }));
    const rolResponse = await POST(request({ email: prefix + "-rol@example.test", password, rol: "COCINA" }));

    expect(roleResponse.status).toBe(400);
    expect(rolResponse.status).toBe(400);
    expect(await prisma.user.count({ where: { email: { startsWith: prefix } } })).toBe(0);
  });

  it("rechaza emails inválidos", async () => {
    const response = await POST(request({ email: "no-es-un-email", password }));
    expect(response.status).toBe(400);
  });
});
