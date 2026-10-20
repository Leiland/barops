import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAccess, dashboardPath, type Resource } from "@/lib/auth/permissions";

export async function currentUser() {
  const session = await auth();
  return session?.user?.id ? session.user : null;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(resource: Resource) {
  const user = await requireUser();
  if (!canAccess(user.role, resource)) redirect("/unauthorized");
  return user;
}

export async function redirectToDashboard() {
  const user = await requireUser();
  redirect(dashboardPath(user.role));
}
