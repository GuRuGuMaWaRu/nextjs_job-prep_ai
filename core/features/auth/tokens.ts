import crypto from "crypto";

/**
 * Generate a cryptographically secure random token
 * @param length - Length of the token in bytes (default: 32)
 * @returns Random token as hex string
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate a random user ID (UUID v4)
 * @returns UUID v4 string
 */
export function generateUserId(): string {
  return crypto.randomUUID();
}

/**
 * Create a hash of a token for comparison
 * Useful for storing hashed tokens in database for extra security
 * @param token - Token to hash
 * @returns SHA256 hash of the token
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

