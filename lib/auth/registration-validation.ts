export type RegistrationCredentials = { email: string; password: string };

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string): string | null {
  const email = normalizeEmail(value);
  if (email.length === 0 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Ingresá un email válido.";
  }
  if (email.split("@")[0].length > 64) return "Ingresá un email válido.";
  return null;
}
