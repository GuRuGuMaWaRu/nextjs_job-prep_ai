jest.mock("@/core/features/auth/actions", () => ({
  validateSessionAction: jest.fn(),
}));

jest.mock("@/core/features/auth/cookies", () => ({
  deleteSessionCookie: jest.fn(),
  getSessionToken: jest.fn(),
}));

import { validateSessionAction } from "@/core/features/auth/actions";
import {
  deleteSessionCookie,
  getSessionToken,
} from "@/core/features/auth/cookies";
import { TEST_USER_ID } from "@core/test-utils/constants";
import { makeSession } from "@core/test-utils/factories";

import { GET } from "./route";

const mockValidateSessionAction = validateSessionAction as jest.MockedFunction<
  typeof validateSessionAction
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
    mockValidateSessionAction.mockReset();
    mockDeleteSessionCookie.mockReset();
    mockGetSessionToken.mockReset();
  });

  it("redirects to the landing page when the session token is missing", async () => {
    mockGetSessionToken.mockResolvedValueOnce(null);

    const response = await GET(buildRequest());

    expectRedirect(response, "http://localhost:3000/");
    expect(mockValidateSessionAction).not.toHaveBeenCalled();
    expect(mockDeleteSessionCookie).not.toHaveBeenCalled();
  });

  it("deletes the cookie and redirects to the landing page when the token is invalid", async () => {
    const session = makeSession({ userId: TEST_USER_ID });
    mockGetSessionToken.mockResolvedValueOnce(session.token);
    mockValidateSessionAction.mockResolvedValueOnce(false);

    const response = await GET(buildRequest());

    expectRedirect(response, "http://localhost:3000/");
    expect(mockValidateSessionAction).toHaveBeenCalledWith(session.token);
    expect(mockDeleteSessionCookie).toHaveBeenCalledTimes(1);
  });

  it("redirects to the app when the session token is valid", async () => {
    const session = makeSession({ userId: TEST_USER_ID });
    mockGetSessionToken.mockResolvedValueOnce(session.token);
    mockValidateSessionAction.mockResolvedValueOnce(true);

    const response = await GET(buildRequest());

    expectRedirect(response, "http://localhost:3000/app");
    expect(mockValidateSessionAction).toHaveBeenCalledWith(session.token);
    expect(mockDeleteSessionCookie).not.toHaveBeenCalled();
  });

  it("treats validation action failures as invalid sessions", async () => {
    const session = makeSession({ userId: TEST_USER_ID });
    mockGetSessionToken.mockResolvedValueOnce(session.token);
    mockValidateSessionAction.mockResolvedValueOnce(false);

    const response = await GET(buildRequest());

    expectRedirect(response, "http://localhost:3000/");
    expect(mockDeleteSessionCookie).toHaveBeenCalledTimes(1);
  });
});
