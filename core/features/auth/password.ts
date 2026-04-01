import bcrypt from "bcryptjs";

import {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from "@/core/features/auth/constants";

/**
 * Applies Unicode NFC so the same passphrase matches across NFD/NFC inputs
 * (e.g. different OS or paste sources).
 */
export function normalizePassword(password: string): string {
  return password.normalize("NFC");
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(normalizePassword(password), saltRounds);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password from database
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(normalizePassword(password), hash);
}

/**
 * Validate password meets requirements
 * @param password - Password to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validatePassword(password: string): {
  isValid: boolean;
  error?: string;
} {
  const normalized = normalizePassword(password);

  if (normalized.length < MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  if (normalized.length > MAX_PASSWORD_LENGTH) {
    return {
      isValid: false,
      error: `Password must be less than ${MAX_PASSWORD_LENGTH} characters`,
    };
  }

  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(normalized);
  const hasNumber = /[0-9]/.test(normalized);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      error: "Password must contain at least one letter and one number",
    };
  }

  return { isValid: true };
}
