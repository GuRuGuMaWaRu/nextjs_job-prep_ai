import {
  assertLocalAccountVerifiedForEmailLink,
  assertOAuthEmailLinkAllowed,
} from "@/core/features/auth/oauth/oauthLinkPolicy";
import {
  OAuthUnverifiedAccountLinkError,
  OAuthUnverifiedEmailError,
} from "@/core/features/auth/oauth/errors";

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

describe("assertLocalAccountVerifiedForEmailLink", () => {
  const provider = "google" as const;

  it("throws when the local account email is unverified", () => {
    expect(() =>
      assertLocalAccountVerifiedForEmailLink({ emailVerified: null }, provider),
    ).toThrow(OAuthUnverifiedAccountLinkError);
  });

  it("allows linking when the local account email is already verified", () => {
    expect(() =>
      assertLocalAccountVerifiedForEmailLink(
        { emailVerified: new Date(0) },
        provider,
      ),
    ).not.toThrow();
  });
});
