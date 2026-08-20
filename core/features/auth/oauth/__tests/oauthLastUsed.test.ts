jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

import { cookies } from "next/headers";

import { COOKIE_OPTIONS } from "@/core/features/auth/constants";
import {
  OAUTH_LAST_USED_COOKIE_KEY,
  getLastUsedOAuthProvider,
  parseOAuthLastUsedCookieValue,
  setLastUsedOAuthProviderCookie,
} from "@/core/features/auth/oauth/oauthLastUsed";

const mockCookies = jest.mocked(cookies);

function mockCookieStore(rawValue?: string) {
  const store = {
    get: jest.fn(() =>
      rawValue === undefined ? undefined : { value: rawValue },
    ),
    set: jest.fn(),
  };

  mockCookies.mockResolvedValue(
    store as unknown as Awaited<ReturnType<typeof cookies>>,
  );

  return store;
}

beforeEach(() => {
  jest.clearAllMocks();
});

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

describe("setLastUsedOAuthProviderCookie", () => {
  it("stores the allowlisted provider with auth cookie options", async () => {
    const store = mockCookieStore();

    await setLastUsedOAuthProviderCookie("github");

    expect(store.set).toHaveBeenCalledWith(
      OAUTH_LAST_USED_COOKIE_KEY,
      "github",
      expect.objectContaining({
        ...COOKIE_OPTIONS,
        expires: expect.any(Date),
      }),
    );
  });
});

describe("getLastUsedOAuthProvider", () => {
  it("returns the stored allowlisted provider", async () => {
    const store = mockCookieStore("discord");

    await expect(getLastUsedOAuthProvider()).resolves.toBe("discord");

    expect(store.get).toHaveBeenCalledWith(OAUTH_LAST_USED_COOKIE_KEY);
  });

  it("returns undefined for missing or invalid cookie values", async () => {
    const missingStore = mockCookieStore();

    await expect(getLastUsedOAuthProvider()).resolves.toBeUndefined();
    expect(missingStore.get).toHaveBeenCalledWith(OAUTH_LAST_USED_COOKIE_KEY);

    const invalidStore = mockCookieStore("linkedin");

    await expect(getLastUsedOAuthProvider()).resolves.toBeUndefined();
    expect(invalidStore.get).toHaveBeenCalledWith(OAUTH_LAST_USED_COOKIE_KEY);
  });
});
