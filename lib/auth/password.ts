import { hash, verify, type Algorithm } from "@node-rs/argon2";
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as common from "@zxcvbn-ts/language-common";
import * as english from "@zxcvbn-ts/language-en";

const OPTIONS = { algorithm: 2 as Algorithm, memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 };
const estimator = new ZxcvbnFactory({
  dictionary: { ...common.dictionary, ...english.dictionary },
  graphs: common.adjacencyGraphs,
  translations: english.translations,
});

export function normalizePassword(value: string): string {
  return value.normalize("NFC");
}

export function validateNewPassword(value: string, email?: string): string | null {
  const password = normalizePassword(value);
  const length = Array.from(password).length;
  if (length < 15 || length > 128) return "La contraseña debe tener entre 15 y 128 caracteres.";
  const localPart = email?.split("@")[0] ?? "";
  if (estimator.check(password, [localPart, "barops"]).score < 3) {
    return "Elegí una contraseña menos común y difícil de adivinar.";
  }
  return null;
}

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
