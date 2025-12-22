/**
 * Authentication constants and configuration
 */

// Session configuration
export const SESSION_COOKIE_NAME = "session_token";
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_REFRESH_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Token configuration
export const VERIFICATION_TOKEN_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
export const PASSWORD_RESET_TOKEN_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Password requirements
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

// Token types
export const TOKEN_TYPES = {
  EMAIL_VERIFICATION: "email_verification",
  EMAIL_CHANGE: "email_change",
} as const;

// Cookie options
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

