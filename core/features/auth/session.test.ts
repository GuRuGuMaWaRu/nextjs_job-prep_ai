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

function mockDeleteResult() {
  return { rows: [], rowCount: 1, command: "", oid: 1, fields: [] };
}

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
    beforeEach(() => {
      mockGenerateSecureToken.mockReturnValue(testToken);
      jest.useFakeTimers().setSystemTime(new Date("2026-05-01").getTime());
    });

    it("creates a new session and persists it via the database", async () => {
      const testSession = makeSession({
        userId: TEST_USER_ID,
        token: testToken,
        expiresAt: new Date(), // "2026-05-01"
      });

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
      const dbError = new Error("insert failed");

      mockCreateSessionDb.mockRejectedValueOnce(dbError);

      await expect(createSession(TEST_USER_ID)).rejects.toMatchObject({
        message: "Failed to create session",
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error creating session:",
        dbError,
      );
    });
  });

  describe("validateSession", () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date("2026-05-01").getTime());
    });

    it("returns session object if session is valid", async () => {
      const testSession = makeSession({
        userId: TEST_USER_ID,
        token: testToken,
        expiresAt: new Date(), // "2026-05-01"
      });
      mockValidateSessionDb.mockResolvedValue(testSession);

      const result = await validateSession(testToken);

      expect(mockValidateSessionDb).toHaveBeenCalledWith(testToken);
      expect(result).toEqual(testSession);
    });

    it("returns null if session is not valid", async () => {
      mockValidateSessionDb.mockResolvedValue(null);

      const result = await validateSession(testToken);

      expect(mockValidateSessionDb).toHaveBeenCalledWith(testToken);
      expect(result).toBeNull();
    });

    it("throws DatabaseError in case of error", async () => {
      const dbError = new Error("find failed");

      mockValidateSessionDb.mockRejectedValueOnce(dbError);

      await expect(validateSession(testToken)).rejects.toMatchObject({
        message: "Failed to validate session",
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error validating session:",
        dbError,
      );
    });
  });

  describe("extendSessionIfNeeded", () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date("2026-05-05").getTime());
    });

    it("extends session if it is close to expiring", async () => {
      const testSession = makeSession({
        userId: TEST_USER_ID,
        token: testToken,
        expiresAt: new Date("2026-05-10"), // expires in just 5 days; session will be extended because the minimum is SESSION_REFRESH_THRESHOLD_MS (7 days)
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
      expect(mockExtendSessionDb).toHaveBeenCalledWith(
        testSession.id,
        newExpiresAt,
      );
      expect(result).toEqual({
        ...testSession,
        expiresAt: newExpiresAt,
      });
    });

    it("returns unchanged session if extension is not needed", async () => {
      const testSession = makeSession({
        userId: TEST_USER_ID,
        token: testToken,
        expiresAt: new Date("2026-06-15"), // not hitting extension path
      });

      mockValidateSessionDb.mockResolvedValueOnce(testSession);

      const result = await extendSessionIfNeeded(testToken);

      expect(mockExtendSessionDb).not.toHaveBeenCalled();
      expect(result).toEqual(testSession);
    });

    it("returns null if session is invalid", async () => {
      mockValidateSessionDb.mockResolvedValueOnce(null);

      const result = await extendSessionIfNeeded(testToken);

      expect(mockExtendSessionDb).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("throws DatabaseError in case of error", async () => {
      const dbError = new Error("update failed");
      const testSession = makeSession({
        userId: TEST_USER_ID,
        token: testToken,
        expiresAt: new Date("2026-06-15"), // not hitting extension path
      });

      mockValidateSessionDb.mockResolvedValueOnce(testSession);
      mockExtendSessionDb.mockRejectedValueOnce(dbError);

      await expect(extendSessionIfNeeded(testToken)).rejects.toMatchObject({
        message: "Failed to extend session",
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error extending session:",
        dbError,
      );
    });
  });

  describe("deleteSession", () => {
    it("deletes a session", async () => {
      mockDeleteSessionDb.mockResolvedValueOnce(mockDeleteResult());

      await expect(deleteSession(testToken)).resolves.toBeUndefined();
      expect(mockDeleteSessionDb).toHaveBeenCalledTimes(1);
      expect(mockDeleteSessionDb).toHaveBeenCalledWith(testToken);
    });

    it("throws DatabaseError in case of error", async () => {
      const dbError = new Error("delete failed");

      mockDeleteSessionDb.mockRejectedValueOnce(dbError);

      await expect(deleteSession(testToken)).rejects.toMatchObject({
        message: "Failed to delete session",
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error deleting session:",
        dbError,
      );
    });
  });

  describe("deleteAllUserSessions", () => {
    it("deletes all sessions for a user", async () => {
      mockDeleteAllUserSessionsDb.mockResolvedValueOnce(mockDeleteResult());

      await expect(
        deleteAllUserSessions(TEST_USER_ID),
      ).resolves.toBeUndefined();
      expect(mockDeleteAllUserSessionsDb).toHaveBeenCalledTimes(1);
      expect(mockDeleteAllUserSessionsDb).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it("throws DatabaseError in case of error", async () => {
      const dbError = new Error("delete failed");

      mockDeleteAllUserSessionsDb.mockRejectedValueOnce(dbError);

      await expect(deleteAllUserSessions(TEST_USER_ID)).rejects.toMatchObject({
        message: "Failed to delete user sessions",
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error deleting user sessions:",
        dbError,
      );
    });
  });

  describe("deleteExpiredSessions", () => {
    it("deletes all expired sessions", async () => {
      mockDeleteExpiredSessionsDb.mockResolvedValueOnce(mockDeleteResult());

      await expect(deleteExpiredSessions()).resolves.toBeUndefined();
      expect(mockDeleteExpiredSessionsDb).toHaveBeenCalledTimes(1);
    });

    it("throws DatabaseError in case of error", async () => {
      const dbError = new Error("delete failed");

      mockDeleteExpiredSessionsDb.mockRejectedValueOnce(dbError);

      await expect(deleteExpiredSessions()).rejects.toMatchObject({
        message: "Failed to delete expired sessions",
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error deleting expired sessions:",
        dbError,
      );
    });
  });

  describe("getUserSessions", () => {
    it("returns sessions", async () => {
      const sessions = [
        makeSession({ id: "abc_1" }),
        makeSession({ id: "abc_2" }),
      ];

      mockGetUserSessionsDb.mockResolvedValueOnce(sessions);

      const result = await getUserSessions(TEST_USER_ID);

      expect(mockGetUserSessionsDb).toHaveBeenCalledTimes(1);
      expect(mockGetUserSessionsDb).toHaveBeenCalledWith(TEST_USER_ID);
      expect(result).toEqual(sessions);
    });

    it("returns empty array if there are no sessions", async () => {
      mockGetUserSessionsDb.mockResolvedValueOnce([]);

      const result = await getUserSessions(TEST_USER_ID);

      expect(mockGetUserSessionsDb).toHaveBeenCalledTimes(1);
      expect(mockGetUserSessionsDb).toHaveBeenCalledWith(TEST_USER_ID);
      expect(result).toEqual([]);
    });

    it("throws DatabaseError in case of error", async () => {
      const dbError = new Error("select failed");

      mockGetUserSessionsDb.mockRejectedValueOnce(dbError);

      await expect(getUserSessions(TEST_USER_ID)).rejects.toMatchObject({
        message: "Failed to get user sessions",
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error getting user sessions:",
        dbError,
      );
    });
  });
});
