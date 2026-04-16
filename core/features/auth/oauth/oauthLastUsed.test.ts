import {
  OAUTH_LAST_USED_COOKIE_KEY,
  parseOAuthLastUsedCookieValue,
} from "@/core/features/auth/oauth/oauthLastUsed";

describe("parseOAuthLastUsedCookieValue", () => {
  it("returns undefined for undefined, empty, or invalid values", () => {
    expect(parseOAuthLastUsedCookieValue(undefined)).toBeUndefined();
    expect(parseOAuthLastUsedCookieValue("")).toBeUndefined();
    expect(parseOAuthLastUsedCookieValue("facebook")).toBeUndefined();
    expect(parseOAuthLastUsedCookieValue("google ")).toBeUndefined();
    expect(
      parseOAuthLastUsedCookieValue("https://evil.example"),
    ).toBeUndefined();
  });

  it("returns allowlisted providers", () => {
    expect(parseOAuthLastUsedCookieValue("google")).toBe("google");
    expect(parseOAuthLastUsedCookieValue("github")).toBe("github");
    expect(parseOAuthLastUsedCookieValue("discord")).toBe("discord");
  });
});

describe("OAUTH_LAST_USED_COOKIE_KEY", () => {
  it("is stable for callers and tests", () => {
    expect(OAUTH_LAST_USED_COOKIE_KEY).toBe("oauth_last_used");
  });
});
