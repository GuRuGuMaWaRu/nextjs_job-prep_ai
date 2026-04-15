import { assertOAuthEmailLinkAllowed } from "@/core/features/auth/oauth/oauthLinkPolicy";
import { OAuthUnverifiedEmailError } from "@/core/features/auth/oauth/errors";

describe("assertOAuthEmailLinkAllowed", () => {
  const provider = "discord" as const;

  it("does not throw when no existing user has this email", () => {
    expect(() =>
      assertOAuthEmailLinkAllowed(
        {
          emailVerified: false,
        },
        null,
        provider,
      ),
    ).not.toThrow();
  });

  it("throws when an account exists with this email but IdP email is unverified", () => {
    expect(() =>
      assertOAuthEmailLinkAllowed(
        {
          emailVerified: false,
        },
        { id: "existing" },
        provider,
      ),
    ).toThrow(OAuthUnverifiedEmailError);
  });

  it("allows linking when IdP email is verified and an account exists", () => {
    expect(() =>
      assertOAuthEmailLinkAllowed(
        {
          emailVerified: true,
        },
        { id: "existing" },
        provider,
      ),
    ).not.toThrow();
  });
});
