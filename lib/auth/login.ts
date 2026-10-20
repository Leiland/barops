import { prisma } from "@/lib/prisma";
import { consumeLoginLimits } from "@/lib/auth/rate-limit";
import { verifyPassword } from "@/lib/auth/password";
import { createAuthSession } from "@/lib/auth/session";

export async function authenticateCredentials(credentials: Partial<Record<"email" | "password", unknown>>, request: Request) {
  const email = typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
  const password = typeof credentials.password === "string" ? credentials.password : "";
  if (!email || !password || email.length > 254 || password.length > 1024) return null;
  if (!(await consumeLoginLimits(email, request))) return null;
  const user = await prisma.user.findUnique({ where: { email } });
  // Match the expensive verification path for unknown accounts.
  const hash = user?.passwordHash ?? DUMMY_HASH;
  const correct = await verifyPassword(hash, password);
  if (!user || !correct || !user.emailVerifiedAt || user.deletedAt) return null;
  const sessionId = await createAuthSession(user.id);
  return { id: user.id, name: user.nombre, email: user.email, role: user.rol, sessionId };
}

const DUMMY_HASH = "$argon2id$v=19$m=19456,t=2,p=1$5oEWgRLnEJywy+90diT8BA$ICX7gEaAQar/8QDe1NT3T44f0D27OUvxz4Vc2yIZJl4";
