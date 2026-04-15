jest.mock("@/core/data/env/server", () => ({
  env: {
    OAUTH_REDIRECT_URL_BASE: "http://localhost:3000",
  },
}));

import { selectGithubEmailFromVerifiedList } from "@/core/features/auth/oauth/github";

describe("selectGithubEmailFromVerifiedList", () => {
  it("prefers primary and verified", () => {
    expect(
      selectGithubEmailFromVerifiedList([
        { email: "secondary@x.com", primary: false, verified: true },
        { email: "primary@x.com", primary: true, verified: true },
      ]),
    ).toBe("primary@x.com");
  });

  it("falls back to first verified when no primary verified", () => {
    expect(
      selectGithubEmailFromVerifiedList([
        { email: "a@x.com", primary: true, verified: false },
        { email: "b@x.com", primary: false, verified: true },
      ]),
    ).toBe("b@x.com");
  });

  it("returns null when no verified email exists", () => {
    expect(
      selectGithubEmailFromVerifiedList([
        { email: "a@x.com", primary: true, verified: false },
        { email: "b@x.com", primary: false, verified: false },
      ]),
    ).toBeNull();
  });

  it("lowercases the chosen email", () => {
    expect(
      selectGithubEmailFromVerifiedList([
        { email: "User@Example.COM", primary: true, verified: true },
      ]),
    ).toBe("user@example.com");
  });
});
