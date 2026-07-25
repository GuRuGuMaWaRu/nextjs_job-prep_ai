jest.mock("@/core/features/auth/session", () => ({
  getSessionByToken: jest.fn(),
}));

jest.mock("@/core/features/auth/cookies", () => ({
  deleteSessionCookie: jest.fn(),
  getSessionToken: jest.fn(),
}));

import { getSessionByToken } from "@/core/features/auth/session";
import {
  deleteSessionCookie,
  getSessionToken,
} from "@/core/features/auth/cookies";

import { TEST_USER_ID } from "@core/test-utils/constants";
import { makeSession } from "@core/test-utils/factories";

import { GET } from "./route";

const mockGetSessionByToken = getSessionByToken as jest.MockedFunction<
  typeof getSessionByToken
>;
const mockDeleteSessionCookie = deleteSessionCookie as jest.MockedFunction<
  typeof deleteSessionCookie
>;
const mockGetSessionToken = getSessionToken as jest.MockedFunction<
  typeof getSessionToken
>;

function buildRequest(): Request {
  return new Request("http://localhost:3000/api/auth/validate-session", {
    method: "GET",
  });
}

function expectRedirect(response: Response, location: string): void {
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe(location);
}

describe("GET /api/auth/validate-session", () => {
  beforeEach(() => {
    mockGetSessionByToken.mockReset();
    mockDeleteSessionCookie.mockReset();
    mockGetSessionToken.mockReset();
  });

  it("redirects to the landing page when the session token is missing", async () => {
    mockGetSessionToken.mockResolvedValue(null);

    const response = await GET(buildRequest());

    expectRedirect(response, "http://localhost:3000/");
    expect(mockGetSessionByToken).not.toHaveBeenCalled();
    expect(mockDeleteSessionCookie).not.toHaveBeenCalled();
  });

  it("deletes the cookie and redirects to the landing page when the session is invalid", async () => {
    const session = makeSession({ userId: TEST_USER_ID });
    mockGetSessionToken.mockResolvedValue(session.token);
    mockGetSessionByToken.mockResolvedValue(null);

    const response = await GET(buildRequest());

    expectRedirect(response, "http://localhost:3000/");
    expect(mockGetSessionByToken).toHaveBeenCalledWith(session.token);
    expect(mockDeleteSessionCookie).toHaveBeenCalledTimes(1);
  });

  it("redirects to the app when the session token is valid", async () => {
    const session = makeSession({ userId: TEST_USER_ID });
    mockGetSessionToken.mockResolvedValue(session.token);
    mockGetSessionByToken.mockResolvedValue(session);

    const response = await GET(buildRequest());

    expectRedirect(response, "http://localhost:3000/app");
    expect(mockGetSessionByToken).toHaveBeenCalledWith(session.token);
    expect(mockDeleteSessionCookie).not.toHaveBeenCalled();
  });
});
