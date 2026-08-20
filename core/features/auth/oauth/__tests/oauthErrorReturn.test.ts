jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

import { cookies } from "next/headers";

import { routes } from "@/core/data/routes";
import {
  OAUTH_ERROR_RETURN_COOKIE_KEY,
  clearOAuthErrorReturnCookie,
  getOAuthErrorReturnPathAndClear,
  oauthErrorReturnToPath,
  setOAuthErrorReturnForNextOAuth,
} from "@/core/features/auth/oauth/oauthErrorReturn";

const mockCookies = jest.mocked(cookies);

function mockCookieStore(rawValue?: string) {
  const store = {
    get: jest.fn(() =>
      rawValue === undefined ? undefined : { value: rawValue },
    ),
    set: jest.fn(),
    delete: jest.fn(),
  };

  mockCookies.mockResolvedValue(
    store as unknown as Awaited<ReturnType<typeof cookies>>,
  );

  return store;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("oauthErrorReturnToPath", () => {
  it("maps sign-up to routes.signUp", () => {
    expect(oauthErrorReturnToPath("sign-up")).toBe(routes.signUp);
  });

  it("maps sign-in to routes.signIn", () => {
    expect(oauthErrorReturnToPath("sign-in")).toBe(routes.signIn);
  });

  it("defaults to sign-in for undefined", () => {
    expect(oauthErrorReturnToPath(undefined)).toBe(routes.signIn);
  });

  it("defaults to sign-in for tampered or unknown values", () => {
    expect(oauthErrorReturnToPath("https://evil.example")).toBe(routes.signIn);
    expect(oauthErrorReturnToPath("sign-up ")).toBe(routes.signIn);
    expect(oauthErrorReturnToPath("")).toBe(routes.signIn);
  });
});

describe("setOAuthErrorReturnForNextOAuth", () => {
  it("sets a short-lived sign-up return cookie", async () => {
    const store = mockCookieStore();

    await setOAuthErrorReturnForNextOAuth("sign-up");

    expect(store.set).toHaveBeenCalledWith(
      OAUTH_ERROR_RETURN_COOKIE_KEY,
      "sign-up",
      expect.objectContaining({
        secure: true,
        httpOnly: true,
        sameSite: "lax",
        expires: expect.any(Date),
      }),
    );
    expect(store.delete).not.toHaveBeenCalled();
  });

  it("clears stale return cookies when starting from sign-in", async () => {
    const store = mockCookieStore();

    await setOAuthErrorReturnForNextOAuth("sign-in");

    expect(store.delete).toHaveBeenCalledWith(OAUTH_ERROR_RETURN_COOKIE_KEY);
    expect(store.set).not.toHaveBeenCalled();
  });
});

describe("getOAuthErrorReturnPathAndClear", () => {
  it("returns the stored path and clears the cookie", async () => {
    const store = mockCookieStore("sign-up");

    await expect(getOAuthErrorReturnPathAndClear()).resolves.toBe(
      routes.signUp,
    );

    expect(store.get).toHaveBeenCalledWith(OAUTH_ERROR_RETURN_COOKIE_KEY);
    expect(store.delete).toHaveBeenCalledWith(OAUTH_ERROR_RETURN_COOKIE_KEY);
  });

  it("defaults tampered values to sign-in after clearing the cookie", async () => {
    const store = mockCookieStore("https://evil.example");

    await expect(getOAuthErrorReturnPathAndClear()).resolves.toBe(
      routes.signIn,
    );

    expect(store.delete).toHaveBeenCalledWith(OAUTH_ERROR_RETURN_COOKIE_KEY);
  });
});

describe("clearOAuthErrorReturnCookie", () => {
  it("deletes the return cookie", async () => {
    const store = mockCookieStore();

    await clearOAuthErrorReturnCookie();

    expect(store.delete).toHaveBeenCalledWith(OAUTH_ERROR_RETURN_COOKIE_KEY);
  });
});
