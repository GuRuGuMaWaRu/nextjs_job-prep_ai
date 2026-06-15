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
import { SESSION_DURATION_MS } from "@/core/features/auth/constants";
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

  const testToken = "test-token-abc";

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleErrorSpy.mockRestore();
  });

  describe("createSession", () => {
    mockGenerateSecureToken.mockReturnValue(testToken);
    jest.useFakeTimers().setSystemTime(new Date("2026-05-01").getTime());

    const testSession = makeSession({
      userId: TEST_USER_ID,
      token: testToken,
      expiresAt: new Date(), // "2026-05-01"
    });

    it("creates a new session and persists it via the database", async () => {
      mockCreateSessionDb.mockResolvedValue([testSession]);

      const result = await createSession(TEST_USER_ID);

      expect(mockGenerateSecureToken).toHaveBeenCalledTimes(1);
      expect(mockCreateSessionDb).toHaveBeenCalledTimes(1);
      expect(mockCreateSessionDb).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        token: testToken,
        expiresAt: new Date("2026-05-31"), // "2026-05-01" + 30 days
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

    it("throws DatabaseError with the defined message", async () => {
      const dbError = new Error("insert failed");

      mockCreateSessionDb.mockRejectedValueOnce(dbError);

      const error = await createSession(TEST_USER_ID).catch((err) => err);

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toBe("Failed to create session");
      expect(error.cause).toBeDefined();
    });
  });

  describe("validateSession", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-05-01").getTime());

    const testSession = makeSession({
      userId: TEST_USER_ID,
      token: testToken,
      expiresAt: new Date(), // "2026-05-01"
    });

    it("returns session object if session is valid", async () => {
      mockValidateSessionDb.mockResolvedValue(testSession);

      const result = await validateSession(testToken);

      expect(mockValidateSessionDb).toHaveBeenCalledWith(testToken);
      expect(result).toEqual(testSession);
    });

    it("returns null if session is not valid", async () => {
      mockValidateSessionDb.mockResolvedValue(undefined);

      const result = await validateSession(testToken);

      expect(mockValidateSessionDb).toHaveBeenCalledWith(testToken);
      expect(result).toBeNull();
    });

    it("throws DatabaseError in case of error", async () => {
      const error = new Error("find failed");

      mockValidateSessionDb.mockRejectedValueOnce(error);

      await expect(validateSession(testToken)).rejects.toThrow(DatabaseError);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error validating session:",
        error,
      );
    });

    it("throws DatabaseError with the defined message", async () => {
      const dbError = new Error("find failed");

      mockValidateSessionDb.mockRejectedValueOnce(dbError);

      const error = await validateSession(testToken).catch((err) => err);

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toBe("Failed to validate session");
      expect(error.cause).toBeDefined();
    });
  });

  describe("extendSessionIfNeeded", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-05-01").getTime());

    it("extends session if it is close to expiring", async () => {
      const testSession = makeSession({
        userId: TEST_USER_ID,
        token: testToken,
        expiresAt: new Date("2026-05-10"), // expires in just 10 days, so session will be extended
      });
      const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);

      mockValidateSessionDb.mockResolvedValueOnce(testSession);
      mockExtendSessionDb.mockResolvedValueOnce([
        {
          ...testSession,
          expiresAt: newExpiresAt,
        },
      ]);

      const result = await extendSessionIfNeeded(testToken);

      expect(mockExtendSessionDb).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        ...testSession,
        expiresAt: newExpiresAt,
      });
    });

    it("returns unchanged session if extension is not needed", async () => {
      const testSession = makeSession({
        userId: TEST_USER_ID,
        token: testToken,
        expiresAt: new Date("2026-06-31"),
      });

      mockValidateSessionDb.mockResolvedValueOnce(testSession);

      const result = await extendSessionIfNeeded(testToken);

      expect(mockExtendSessionDb).not.toHaveBeenCalled();
      expect(result).toEqual(testSession);
    });

    it("returns null if session is invalid", async () => {
      mockValidateSessionDb.mockResolvedValueOnce(undefined);

      const result = await extendSessionIfNeeded(testToken);

      expect(mockExtendSessionDb).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("throws DatabaseError in case of error", async () => {
      const error = new Error("update failed");
      const testSession = makeSession({
        userId: TEST_USER_ID,
        token: testToken,
        expiresAt: new Date(),
      });

      mockValidateSessionDb.mockResolvedValueOnce(testSession);
      mockExtendSessionDb.mockRejectedValueOnce(error);

      await expect(extendSessionIfNeeded(testToken)).rejects.toThrow(
        DatabaseError,
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error extending session:",
        error,
      );
    });

    it("throws DatabaseError with the defined message", async () => {
      const dbError = new Error("update failed");
      const testSession = makeSession({
        userId: TEST_USER_ID,
        token: testToken,
        expiresAt: new Date(),
      });

      mockValidateSessionDb.mockResolvedValueOnce(testSession);
      mockExtendSessionDb.mockRejectedValueOnce(dbError);

      const error = await extendSessionIfNeeded(testToken).catch((err) => err);

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toBe("Failed to extend session");
      expect(error.cause).toBeDefined();
    });
  });
});
