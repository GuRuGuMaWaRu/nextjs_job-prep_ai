import { assertOAuthEmailLinkAllowed } from "@/core/features/auth/oauth/oauthLinkPolicy";
import { OAuthUnverifiedEmailError } from "@/core/features/auth/oauth/errors";

describe("assertOAuthEmailLinkAllowed", () => {
  const provider = "discord" as const;

  it("throws when IdP email is unverified", () => {
    expect(() =>
      assertOAuthEmailLinkAllowed(
        {
          emailVerified: false,
        },
        provider,
      ),
    ).toThrow(OAuthUnverifiedEmailError);
  });

  it("allows account creation or linking when IdP email is verified", () => {
    expect(() =>
      assertOAuthEmailLinkAllowed(
        {
          emailVerified: true,
        },
        provider,
      ),
    ).not.toThrow();
  });
});
