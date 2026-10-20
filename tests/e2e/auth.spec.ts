import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../lib/auth/password";

test.describe.configure({ mode: "serial" });

const suffix = randomUUID();
const password = "north star velvet ceramic 2026";
const accounts = {
  admin: "e2e-admin-" + suffix + "@example.test",
  waiter: "e2e-waiter-" + suffix + "@example.test",
  other: "e2e-other-" + suffix + "@example.test",
  kitchen: "e2e-kitchen-" + suffix + "@example.test",
};
const ids: string[] = [];
let otherReservationId: string;

test.beforeAll(async () => {
  const passwordHash = await hashPassword(password);
  for (const [kind, email] of Object.entries(accounts)) {
    const user = await prisma.user.create({
      data: { email, nombre: "E2E " + kind, rol: kind === "admin" ? "ADMIN" : kind === "kitchen" ? "COCINA" : "CAMARERO", passwordHash, emailVerifiedAt: new Date() },
    });
    ids.push(user.id);
    if (kind === "other") {
      const reserva = await prisma.reserva.create({
        data: { clienteNombre: "Cliente privado", fechaHora: new Date(Date.now() + 86_400_000), comensales: 2, creadaPorId: user.id },
      });
      otherReservationId = reserva.id;
    }
  }
});

test.afterAll(async () => {
  if (otherReservationId) await prisma.reserva.delete({ where: { id: otherReservationId } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

async function login(page: import("@playwright/test").Page, email: string, keyboard = false) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  if (keyboard) await page.getByLabel("Contraseña").press("Enter");
  else await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL("**/dashboard/**");
}

test("sin sesión, redirige al login y protege la API", async ({ page }) => {
  await page.goto("/inventario");
  await expect(page).toHaveURL(/\/login$/);
  const response = await page.request.get("/api/reservas/" + otherReservationId);
  expect(response.status()).toBe(401);
});

test("credenciales incorrectas o usuario inexistente no crean sesión", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(accounts.waiter);
  await page.getByLabel("Contraseña").fill("contraseña incorrecta");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByText("Usuario o contraseña incorrectos.", { exact: true })).toHaveText("Usuario o contraseña incorrectos.");
  await page.getByLabel("Email").fill("nadie-" + suffix + "@example.test");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByText("Usuario o contraseña incorrectos.", { exact: true })).toHaveText("Usuario o contraseña incorrectos.");
  expect((await context.cookies()).filter((cookie) => cookie.name.includes("session-token"))).toHaveLength(0);
});

test("camarero accede a reservas pero no a inventario ni datos ajenos", async ({ page, context }) => {
  await login(page, accounts.waiter);
  await expect(page).toHaveURL(/\/dashboard\/camarero$/);
  const cookie = (await context.cookies()).find((item) => item.name.includes("session-token"));
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  if (process.env.EXPECT_SECURE_COOKIE === "true") expect(cookie?.secure).toBe(true);
  await page.goto("/reservas");
  await expect(page.getByRole("heading", { name: "Reservas" })).toBeVisible();
  const response = await page.request.get("/api/reservas/" + otherReservationId);
  expect(response.status()).toBe(404);
  await page.goto("/inventario");
  await expect(page).toHaveURL(/\/unauthorized$/);
  await expect(page.getByAltText(/mapache chef/)).toBeVisible();
});

test("cocina solo ve las comandas permitidas", async ({ page }) => {
  await login(page, accounts.kitchen, true);
  await expect(page).toHaveURL(/\/dashboard\/cocina$/);
  await page.goto("/comandas");
  await expect(page.getByRole("heading", { name: "Comandas" })).toBeVisible();
  await page.goto("/reservas");
  await expect(page).toHaveURL(/\/unauthorized$/);
});

test("admin puede consultar la reserva y logout revoca la sesión", async ({ page, request, context }) => {
  await login(page, accounts.admin);
  await expect(page).toHaveURL(/\/dashboard\/admin$/);
  const response = await page.request.get("/api/reservas/" + otherReservationId);
  expect(response.status()).toBe(200);
  const cookie = (await context.cookies()).find((item) => item.name.includes("session-token"))!;
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.waitForURL("**/login");
  const oldCookieResponse = await request.get("/api/reservas/" + otherReservationId, { headers: { Cookie: cookie.name + "=" + cookie.value } });
  expect(oldCookieResponse.status()).toBe(401);
});

test("sesión vencida no autoriza páginas", async ({ page }) => {
  await login(page, accounts.other);
  await prisma.authSession.updateMany({ where: { userId: ids[2] }, data: { expiresAt: new Date(Date.now() - 1000) } });
  await page.goto("/dashboard/camarero");
  await expect(page).toHaveURL(/\/login$/);
});
