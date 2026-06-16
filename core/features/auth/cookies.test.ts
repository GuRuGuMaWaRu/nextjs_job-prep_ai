jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

import { cookies } from "next/headers";

import {
  SESSION_COOKIE_NAME,
  COOKIE_OPTIONS,
} from "@/core/features/auth/constants";
import {
  setSessionCookie,
  getSessionToken,
  deleteSessionCookie,
} from "./cookies";

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

describe("cookie helpers", () => {
  const testToken = "test-token-abc";

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("setSessionCookie", () => {
    it("sets session cookie with the provided expiresAt date", async () => {
      const store = mockCookieStore();

      await setSessionCookie(testToken, new Date("2026-01-01"));

      expect(store.set).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        testToken,
        expect.objectContaining({
          ...COOKIE_OPTIONS,
          expires: new Date("2026-01-01"),
        }),
      );
    });
  });

  describe("getSessionToken", () => {
    it("returns session token if present", async () => {
      const store = mockCookieStore("session_token");

      const result = await getSessionToken();

      expect(store.get).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
      expect(result).toBe("session_token");
    });

    it("return null is no session token is present", async () => {
      const store = mockCookieStore();

      const result = await getSessionToken();

      expect(store.get).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
      expect(result).toBeNull();
    });
  });

  describe("deleteSessionCookie", () => {
    it("deletes session token", async () => {
      const store = mockCookieStore();

      await deleteSessionCookie();

      expect(store.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
    });
  });
});
