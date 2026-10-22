import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as common from "@zxcvbn-ts/language-common";
import * as english from "@zxcvbn-ts/language-en";

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
