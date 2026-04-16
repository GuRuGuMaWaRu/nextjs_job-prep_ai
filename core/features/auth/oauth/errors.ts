import z from "zod";
import type { OAuthProvider } from "@/core/drizzle/schema/oauthProviderIds";

/**
 * Thrown when `getOAuthClient` cannot build a client because credentials are missing.
 */
class OAuthNotConfiguredError extends Error {
  readonly provider: OAuthProvider;

  constructor(provider: OAuthProvider) {
    super(`OAuth provider is not configured: ${provider}`);
    this.name = "OAuthNotConfiguredError";
    this.provider = provider;
  }
}

/**
 * Thrown when the OAuth token request fails.
 */
class InvalidTokenError extends Error {
  readonly status?: number;
  readonly statusText?: string;
  readonly bodyPreview?: string;

  constructor(zodError: z.ZodError);
  constructor(status: number, statusText: string, bodyPreview: string);
  constructor(arg1: z.ZodError | number, arg2?: string, arg3?: string) {
    if (arg1 instanceof z.ZodError) {
      super("Invalid token", { cause: arg1 });
      this.name = "InvalidTokenError";
      return;
    }

    const status = arg1;
    const statusText = arg2 ?? "";
    const bodyPreview = arg3 ?? "";
    const detail = bodyPreview.trim() ? `: ${bodyPreview.trim()}` : "";

    super(`OAuth token request failed (${status} ${statusText})${detail}`);

    this.name = "InvalidTokenError";
    this.status = status;
    this.statusText = statusText;
    this.bodyPreview = bodyPreview;
  }
}

/**
 * Thrown when the OAuth user info request fails.
 */
class InvalidUserError extends Error {
  constructor(zodError: z.ZodError) {
    super("Invalid user", { cause: zodError });
  }
}

/**
 * Thrown when the OAuth user info request fails.
 */
class OAuthUserInfoHttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly bodyPreview: string;

  constructor(status: number, statusText: string, bodyPreview: string) {
    const detail = bodyPreview.trim() ? `: ${bodyPreview.trim()}` : "";
    super(`OAuth user info request failed (${status} ${statusText})${detail}`);
    this.name = "OAuthUserInfoHttpError";
    this.status = status;
    this.statusText = statusText;
    this.bodyPreview = bodyPreview;
  }
}

/**
 * Thrown when the OAuth state is invalid.
 */
class InvalidStateError extends Error {
  constructor() {
    super("Invalid state");
  }
}

/**
 * Thrown when the OAuth code verifier is invalid.
 */
class InvalidCodeVerifierError extends Error {
  constructor() {
    super("Invalid code verifier");
  }
}

/**
 * Thrown when the identity provider did not return an email (e.g. Discord omits email when absent).
 */
class OAuthMissingEmailError extends Error {
  readonly provider: OAuthProvider;

  constructor(provider: OAuthProvider) {
    super(`OAuth provider did not return an email: ${provider}`);
    this.name = "OAuthMissingEmailError";
    this.provider = provider;
  }
}

/**
 * Thrown when the IdP returned an email that is not verified, but an account with that email already exists.
 */
class OAuthUnverifiedEmailError extends Error {
  readonly provider: OAuthProvider;

  constructor(provider: OAuthProvider) {
    super(`OAuth email is not verified by provider: ${provider}`);
    this.name = "OAuthUnverifiedEmailError";
    this.provider = provider;
  }
}

/**
 * Thrown when the provider exposes no verified email (e.g. GitHub verified list empty).
 */
class OAuthNoVerifiedEmailError extends Error {
  readonly provider: OAuthProvider;

  constructor(provider: OAuthProvider) {
    super(`OAuth provider did not return a verified email: ${provider}`);
    this.name = "OAuthNoVerifiedEmailError";
    this.provider = provider;
  }
}

export {
  OAuthNotConfiguredError,
  InvalidTokenError,
  InvalidUserError,
  OAuthUserInfoHttpError,
  InvalidStateError,
  InvalidCodeVerifierError,
  OAuthMissingEmailError,
  OAuthUnverifiedEmailError,
  OAuthNoVerifiedEmailError,
};
