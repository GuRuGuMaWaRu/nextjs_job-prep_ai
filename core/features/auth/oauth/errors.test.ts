import z from "zod";

import {
  InvalidCodeVerifierError,
  InvalidStateError,
  InvalidTokenError,
  InvalidUserError,
  OAuthMissingEmailError,
  OAuthNoVerifiedEmailError,
  OAuthNotConfiguredError,
  OAuthUnverifiedEmailError,
  OAuthUserInfoHttpError,
} from "@/core/features/auth/oauth/errors";

function createZodError() {
  const result = z.string().safeParse(123);

  if (result.success) {
    throw new Error("Expected fixture parsing to fail");
  }

  return result.error;
}

describe("OAuth errors", () => {
  it("includes provider context for OAuth provider configuration errors", () => {
    const error = new OAuthNotConfiguredError("github");

    expect(error).toMatchObject({
      name: "OAuthNotConfiguredError",
      message: "OAuth provider is not configured: github",
      provider: "github",
    });
  });

  it("wraps invalid token payload validation failures", () => {
    const zodError = createZodError();
    const error = new InvalidTokenError(zodError);

    expect(error).toMatchObject({
      name: "InvalidTokenError",
      message: "Invalid token",
      cause: zodError,
    });
  });

  it("includes HTTP response context for invalid token responses", () => {
    const error = new InvalidTokenError(401, "Unauthorized", "bad token");

    expect(error).toMatchObject({
      name: "InvalidTokenError",
      message: "OAuth token request failed (401 Unauthorized): bad token",
      status: 401,
      statusText: "Unauthorized",
      bodyPreview: "bad token",
    });
  });

  it("omits invalid token response detail when the body preview is blank", () => {
    const error = new InvalidTokenError(500, "Server Error", "   ");

    expect(error.message).toBe("OAuth token request failed (500 Server Error)");
    expect(error.bodyPreview).toBe("   ");
  });

  it("uses empty defaults for invalid token runtime HTTP fields", () => {
    // Reflect.construct intentionally exercises defensive runtime defaults that
    // are hidden by the public TypeScript overloads.
    const error: InvalidTokenError = Reflect.construct(
      InvalidTokenError,
      [418],
    );

    expect(error).toMatchObject({
      message: "OAuth token request failed (418 )",
      status: 418,
      statusText: "",
      bodyPreview: "",
    });
  });

  it("wraps invalid user payload validation failures", () => {
    const zodError = createZodError();
    const error = new InvalidUserError(zodError);

    expect(error).toMatchObject({
      message: "Invalid user",
      cause: zodError,
    });
  });

  it("includes HTTP response context for user info failures", () => {
    const error = new OAuthUserInfoHttpError(403, "Forbidden", "denied");

    expect(error).toMatchObject({
      name: "OAuthUserInfoHttpError",
      message: "OAuth user info request failed (403 Forbidden): denied",
      status: 403,
      statusText: "Forbidden",
      bodyPreview: "denied",
    });
  });

  it("omits user info response detail when the body preview is blank", () => {
    const error = new OAuthUserInfoHttpError(502, "Bad Gateway", "");

    expect(error.message).toBe(
      "OAuth user info request failed (502 Bad Gateway)",
    );
    expect(error.bodyPreview).toBe("");
  });

  it("creates state and code verifier validation errors", () => {
    expect(new InvalidStateError().message).toBe("Invalid state");
    expect(new InvalidCodeVerifierError().message).toBe(
      "Invalid code verifier",
    );
  });

  it("includes provider context for email validation errors", () => {
    expect(new OAuthMissingEmailError("discord")).toMatchObject({
      name: "OAuthMissingEmailError",
      message: "OAuth provider did not return an email: discord",
      provider: "discord",
    });
    expect(new OAuthUnverifiedEmailError("google")).toMatchObject({
      name: "OAuthUnverifiedEmailError",
      message: "OAuth email is not verified by provider: google",
      provider: "google",
    });
    expect(new OAuthNoVerifiedEmailError("github")).toMatchObject({
      name: "OAuthNoVerifiedEmailError",
      message: "OAuth provider did not return a verified email: github",
      provider: "github",
    });
  });
});
