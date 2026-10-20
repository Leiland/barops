import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const SESSION_SECONDS = 8 * 60 * 60;

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function createAuthSession(userId: string): Promise<string> {
  const sessionId = randomBytes(32).toString("base64url");
  await prisma.authSession.create({
    data: { id: digest(sessionId), userId, expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000) },
  });
  return sessionId;
}

export async function activeSession(sessionId: string, userId: string) {
  const session = await prisma.authSession.findUnique({
    where: { id: digest(sessionId) },
    include: { user: true },
  });
  if (!session || session.userId !== userId || session.revokedAt || session.expiresAt <= new Date()) return null;
  if (session.user.deletedAt || !session.user.emailVerifiedAt || !session.user.passwordHash) return null;
  return session.user;
}

export async function revokeAuthSession(sessionId: string): Promise<void> {
  await prisma.authSession.updateMany({
    where: { id: digest(sessionId), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.authSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
