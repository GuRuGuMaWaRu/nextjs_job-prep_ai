jest.mock("@/core/data/env/server", () => ({
  env: {
    OAUTH_REDIRECT_URL_BASE: "http://localhost:3000",
  },
}));

import { mapGoogleUserToResolved } from "@/core/features/auth/oauth/google";

describe("mapGoogleUserToResolved", () => {
  it("maps email_verified true to emailVerified true", () => {
    expect(
      mapGoogleUserToResolved({
        sub: "sub-id",
        email: "a@b.com",
        name: "A",
        email_verified: true,
      }),
    ).toEqual({
      id: "sub-id",
      email: "a@b.com",
      name: "A",
      emailVerified: true,
    });
  });

  it("maps missing email_verified to emailVerified false", () => {
    expect(
      mapGoogleUserToResolved({
        sub: "sub-id",
        email: "a@b.com",
        name: "A",
      }),
    ).toMatchObject({
      emailVerified: false,
    });
  });

  it("maps email_verified false to emailVerified false", () => {
    expect(
      mapGoogleUserToResolved({
        sub: "sub-id",
        email: "a@b.com",
        name: "A",
        email_verified: false,
      }),
    ).toMatchObject({
      emailVerified: false,
    });
  });
});
