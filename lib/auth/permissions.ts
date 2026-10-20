export const PERMISSIONS = {
  dashboard: ["ADMIN", "CAMARERO", "COCINA"],
  reservas: ["ADMIN", "CAMARERO"],
  comandas: ["ADMIN", "CAMARERO", "COCINA"],
  tpv: ["ADMIN", "CAMARERO"],
  inventario: ["ADMIN"],
} as const;

export type Resource = keyof typeof PERMISSIONS;
export type Role = "ADMIN" | "CAMARERO" | "COCINA";

export function canAccess(role: Role, resource: Resource): boolean {
  return (PERMISSIONS[resource] as readonly Role[]).includes(role);
}

export function dashboardPath(role: Role): string {
  return "/dashboard/" + role.toLowerCase();
}
