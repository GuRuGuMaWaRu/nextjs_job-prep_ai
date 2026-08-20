import bcrypt from "bcryptjs";

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
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(normalizePassword(password), hash);
}
