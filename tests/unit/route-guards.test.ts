import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error("REDIRECT:" + path); }),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { currentUser, requirePermission, requireUser, redirectToDashboard } from "@/lib/auth/current";

beforeEach(() => { mocks.auth.mockReset(); mocks.redirect.mockClear(); });

describe("guardas de rutas privadas", () => {
  it("redirige a login sin sesión", async () => {
    mocks.auth.mockResolvedValue(null);
    expect(await currentUser()).toBeNull();
    await expect(requireUser()).rejects.toThrow("REDIRECT:/login");
  });
  it("permite un recurso autorizado y deniega otro", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", role: "CAMARERO" } });
    expect((await requirePermission("reservas")).id).toBe("u1");
    await expect(requirePermission("inventario")).rejects.toThrow("REDIRECT:/unauthorized");
  });
  it("envía a cada usuario a su panel", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u2", role: "COCINA" } });
    await expect(redirectToDashboard()).rejects.toThrow("REDIRECT:/dashboard/cocina");
  });
});
