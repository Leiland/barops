import { hash, verify, type Algorithm } from "@node-rs/argon2";
import { normalizePassword } from "@/lib/auth/password-policy";

export { normalizePassword, validateNewPassword } from "@/lib/auth/password-policy";

const OPTIONS = { algorithm: 2 as Algorithm, memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 };

export async function hashPassword(password: string): Promise<string> {
  return hash(normalizePassword(password), OPTIONS);
}

export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  try {
    return await verify(storedHash, normalizePassword(password));
  } catch {
    return false;
  }
}
