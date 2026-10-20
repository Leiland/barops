import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function clientIp(request: Request): string {
  // Only use forwarded headers when the deployment proxy strips user supplied copies.
  if (process.env.TRUST_PROXY !== "true") return "unknown";
  return request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function bucketKey(scope: string, value: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET no configurado");
  return scope + ":" + createHmac("sha256", secret).update(value).digest("hex");
}

export async function consumeLimit(scope: string, value: string, max: number, windowMs: number): Promise<boolean> {
  const key = bucketKey(scope, value);
  const now = new Date();
  const existing = await prisma.authRateLimit.findUnique({ where: { key } });
  if (!existing || now.getTime() - existing.windowStart.getTime() >= windowMs) {
    await prisma.authRateLimit.upsert({
      where: { key },
      create: { key, attempts: 1, windowStart: now },
      update: { attempts: 1, windowStart: now, blockedUntil: null },
    });
    return true;
  }
  if (existing.blockedUntil && existing.blockedUntil > now) return false;
  const updated = await prisma.authRateLimit.update({
    where: { key },
    data: { attempts: { increment: 1 }, blockedUntil: existing.attempts + 1 > max ? new Date(existing.windowStart.getTime() + windowMs) : null },
  });
  return updated.attempts <= max;
}

export async function consumeLoginLimits(email: string, request: Request): Promise<boolean> {
  const [account, ip] = await Promise.all([
    consumeLimit("login-account", email, 5, 15 * 60_000),
    consumeLimit("login-ip", clientIp(request), 30, 15 * 60_000),
  ]);
  return account && ip;
}

export async function consumeRecoveryLimits(email: string, request: Request): Promise<boolean> {
  const [account, ip] = await Promise.all([
    consumeLimit("recover-account", email, 3, 60 * 60_000),
    consumeLimit("recover-ip", clientIp(request), 20, 60 * 60_000),
  ]);
  return account && ip;
}
