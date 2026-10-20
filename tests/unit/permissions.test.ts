import { describe, expect, it } from "vitest";
import { canAccess, dashboardPath } from "@/lib/auth/permissions";

describe("matriz de permisos", () => {
  it("permite al administrador todas las secciones", () => {
    for (const resource of ["dashboard", "reservas", "comandas", "tpv", "inventario"] as const) expect(canAccess("ADMIN", resource)).toBe(true);
  });
  it("restringe sala, cocina e inventario", () => {
    expect(canAccess("CAMARERO", "reservas")).toBe(true);
    expect(canAccess("CAMARERO", "inventario")).toBe(false);
    expect(canAccess("COCINA", "comandas")).toBe(true);
    expect(canAccess("COCINA", "tpv")).toBe(false);
  });
  it("envía cada rol a su panel", () => {
    expect(dashboardPath("ADMIN")).toBe("/dashboard/admin");
    expect(dashboardPath("CAMARERO")).toBe("/dashboard/camarero");
    expect(dashboardPath("COCINA")).toBe("/dashboard/cocina");
  });
});
