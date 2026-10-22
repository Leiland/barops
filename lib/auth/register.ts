import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { validateNewPassword } from "@/lib/auth/password-policy";
import { normalizeEmail, validateEmail, type RegistrationCredentials } from "@/lib/auth/registration-validation";

export class RegistrationError extends Error {
  constructor(public readonly code: "INVALID_CREDENTIALS" | "EMAIL_TAKEN", message: string) {
    super(message);
    this.name = "RegistrationError";
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function registerUser(credentials: RegistrationCredentials) {
  const email = normalizeEmail(credentials.email);
  const validationError = validateEmail(email) ?? validateNewPassword(credentials.password, email);
  if (validationError) throw new RegistrationError("INVALID_CREDENTIALS", validationError);

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new RegistrationError("EMAIL_TAKEN", "Ya existe una cuenta con ese email.");

  const passwordHash = await hashPassword(credentials.password);
  try {
    return await prisma.user.create({
      data: {
        email,
        nombre: email,
        rol: "CAMARERO",
        passwordHash,
        emailVerifiedAt: new Date(),
      },
      select: { id: true, email: true, rol: true },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new RegistrationError("EMAIL_TAKEN", "Ya existe una cuenta con ese email.");
    }
    throw error;
  }
}
