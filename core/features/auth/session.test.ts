jest.mock("@/core/features/auth/db", () => ({
  createSessionDb: jest.fn(),
  deleteAllUserSessionsDb: jest.fn(),
  deleteExpiredSessionsDb: jest.fn(),
  deleteSessionDb: jest.fn(),
  extendSessionDb: jest.fn(),
  getUserSessionsDb: jest.fn(),
  validateSessionDb: jest.fn(),
}));

jest.mock("@/core/features/auth/tokens", () => ({
  generateSecureToken: jest.fn(),
}));

import {
  createSessionDb,
  deleteAllUserSessionsDb,
  deleteExpiredSessionsDb,
  deleteSessionDb,
  extendSessionDb,
  getUserSessionsDb,
  validateSessionDb,
} from "@/core/features/auth/db";
import { generateSecureToken } from "@/core/features/auth/tokens";
import { DatabaseError } from "@/core/dal/errors";

import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeSession } from "@core/test-utils/factories";

import {
  createSession,
  validateSession,
  extendSessionIfNeeded,
  deleteSession,
  deleteAllUserSessions,
  deleteExpiredSessions,
  getUserSessions,
} from "./session";

const mockCreateSessionDb = jest.mocked(createSessionDb);
const mockDeleteAllUserSessionsDb = jest.mocked(deleteAllUserSessionsDb);
const mockDeleteExpiredSessionsDb = jest.mocked(deleteExpiredSessionsDb);
const mockDeleteSessionDb = jest.mocked(deleteSessionDb);
const mockExtendSessionDb = jest.mocked(extendSessionDb);
const mockGetUserSessionsDb = jest.mocked(getUserSessionsDb);
const mockValidateSessionDb = jest.mocked(validateSessionDb);
const mockGenerateSecureToken = jest.mocked(generateSecureToken);

describe("session helpers", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleErrorSpy.mockRestore();
  });

  describe("createSession", () => {
    const testToken = "test-token-abc";

    mockGenerateSecureToken.mockReturnValue(testToken);
    jest
      .useFakeTimers()
      .setSystemTime(new Date("2026-05-01T12:00:00.000Z").getTime()); // should return "2026-05-31T12:00:00.000Z"

    it("creates a new session and persists it via the database", async () => {
      const testSession = makeSession({
        userId: TEST_USER_ID,
        token: testToken,
        expiresAt: new Date("2026-05-31T12:00:00.000Z"),
      });

      mockCreateSessionDb.mockResolvedValue([testSession]);

      const result = await createSession(TEST_USER_ID);

      expect(mockGenerateSecureToken).toHaveBeenCalledTimes(1);
      expect(mockCreateSessionDb).toHaveBeenCalledTimes(1);
      expect(mockCreateSessionDb).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        token: testToken,
        expiresAt: new Date("2026-05-31T12:00:00.000Z"),
      });
      expect(result).toEqual(testSession);
    });

    it("throws DatabaseError in case of error", async () => {
      const error = new Error("insert failed");

      mockCreateSessionDb.mockRejectedValueOnce(error);

      await expect(createSession(TEST_USER_ID)).rejects.toThrow(DatabaseError);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error creating session:",
        error,
      );
    });
  });
});
