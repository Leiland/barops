import { createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { hashPassword, validateNewPassword } from "@/lib/auth/password";
import { clientIp, consumeLimit, consumeRecoveryLimits } from "@/lib/auth/rate-limit";

export const RECOVERY_MESSAGE = "Si el email corresponde a una cuenta, recibirás instrucciones para restablecer la contraseña.";

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function resetUrl(token: string): string {
  const origin = process.env.APP_URL;
  if (!origin) throw new Error("APP_URL no configurado");
  const url = new URL("/reset-password", origin);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("APP_URL debe usar HTTPS");
  url.searchParams.set("token", token);
  return url.toString();
}

async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const from = process.env.SMTP_FROM;
  if (!host || !from) throw new Error("SMTP no configurado");
  const port = Number(process.env.SMTP_PORT ?? "587");
  const transporter = nodemailer.createTransport({
    host, port, secure: port === 465, requireTLS: port !== 465,
    auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  await transporter.sendMail({ from, to, subject, text: body });
}

export async function requestPasswordReset(rawEmail: string, request: Request, deferSend?: (delivery: () => Promise<void>) => void): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || email.length > 254 || !email.includes("@")) return;
  if (!(await consumeRecoveryLimits(email, request))) return;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !user.emailVerifiedAt || user.deletedAt) return;
  const token = randomBytes(32).toString("base64url");
  const hash = tokenHash(token);
  await prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + 30 * 60_000) },
  });
  const delivery = async () => {
    try {
      await sendEmail(user.email, "Restablecer contraseña de BarOps",
        "Solicitaste restablecer tu contraseña. Abrí este enlace dentro de 30 minutos:\n" + resetUrl(token) +
        "\n\nSi no solicitaste esto, ignorá el mensaje.");
    } catch (error) {
      await prisma.passwordResetToken.deleteMany({ where: { tokenHash: hash } });
      console.error("No se pudo enviar el correo de recuperación", error);
    }
  };
  if (deferSend) deferSend(delivery);
  else await delivery();
}

export async function resetPassword(token: string, password: string, request: Request): Promise<string | null> {
  if (!(await consumeLimit("reset-ip", clientIp(request), 10, 15 * 60_000))) return "Demasiados intentos. Probá más tarde.";
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return "El enlace no es válido o venció.";
  const stored = await prisma.passwordResetToken.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: true } });
  if (!stored || stored.usedAt || stored.expiresAt <= new Date() || stored.user.deletedAt || !stored.user.emailVerifiedAt) return "El enlace no es válido o venció.";
  const validationError = validateNewPassword(password, stored.user.email);
  if (validationError) return validationError;
  const newHash = await hashPassword(password);
  try {
    await prisma.$transaction(async (tx) => {
      const used = await tx.passwordResetToken.updateMany({
        where: { id: stored.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (used.count !== 1) throw new Error("TOKEN_USED");
      await tx.user.update({ where: { id: stored.userId }, data: { passwordHash: newHash } });
      await tx.authSession.updateMany({ where: { userId: stored.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.passwordResetToken.updateMany({ where: { userId: stored.userId, usedAt: null }, data: { usedAt: new Date() } });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "TOKEN_USED") return "El enlace no es válido o venció.";
    throw error;
  }
  try {
    await sendEmail(stored.user.email, "Tu contraseña de BarOps cambió",
      "La contraseña de tu cuenta se cambió. Si no fuiste vos, contactá de inmediato a un administrador.");
  } catch (error) {
    console.error("No se pudo enviar la notificación de cambio de contraseña", error);
  }
  return null;
}
