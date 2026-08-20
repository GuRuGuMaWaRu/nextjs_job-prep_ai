jest.mock("@/core/lib/requireUser", () => ({
  requireUser: jest.fn(),
}));

jest.mock("@/core/features/auth/permissions", () => ({
  hasPermission: jest.fn(),
}));

jest.mock("@/core/features/resumeAnalysis/db", () => ({
  tryInsertResumeAnalysisDb: jest.fn(),
}));

import { hasPermission } from "@/core/features/auth/permissions";
import { PLAN_LIMITS, PERMISSIONS } from "@/core/data/constants";
import { DatabaseError, UnauthorizedError } from "@/core/lib/errors";
import { requireUser } from "@/core/lib/requireUser";
import { tryInsertResumeAnalysisDb } from "@/core/features/resumeAnalysis/db";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeUser } from "@/core/test-utils/factories/user";

import {
  checkResumeAnalysisPermissionService,
  reserveResumeAnalysisUsageService,
} from "./service";

const mockRequireUser = jest.mocked(requireUser);
const mockHasPermission = jest.mocked(hasPermission);
const mockTryInsertResumeAnalysisDb = jest.mocked(tryInsertResumeAnalysisDb);

const jobInfoId = "00000000-0000-4000-8000-000000000401";

describe("resume analysis services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireUser.mockResolvedValue(makeUser({ id: TEST_USER_ID }));
  });

  describe("checkResumeAnalysisPermissionService", () => {
    it("passes correct permission to hasPermission", async () => {
      const user = makeUser({ id: TEST_USER_ID });
      mockRequireUser.mockResolvedValue(user);
      mockHasPermission.mockResolvedValueOnce(true);

      await checkResumeAnalysisPermissionService();

      expect(mockHasPermission).toHaveBeenCalledWith(
        PERMISSIONS.RESUME_ANALYSES,
        user,
      );
    });

    it("returns true when hasPermission resolves true", async () => {
      const user = makeUser({ id: TEST_USER_ID });
      mockRequireUser.mockResolvedValue(user);
      mockHasPermission.mockResolvedValueOnce(true);

      await expect(checkResumeAnalysisPermissionService()).resolves.toBe(true);
    });

    it("returns false when hasPermission resolves false", async () => {
      const user = makeUser({ id: TEST_USER_ID });
      mockRequireUser.mockResolvedValue(user);
      mockHasPermission.mockResolvedValueOnce(false);

      await expect(checkResumeAnalysisPermissionService()).resolves.toBe(false);
    });

    it("rejects when the user is unauthenticated", async () => {
      mockRequireUser.mockRejectedValue(new UnauthorizedError());

      await expect(
        checkResumeAnalysisPermissionService(),
      ).rejects.toBeInstanceOf(UnauthorizedError);

      expect(mockHasPermission).not.toHaveBeenCalled();
    });

    it("throws when hasPermission rejects", async () => {
      const user = makeUser({ id: TEST_USER_ID });
      mockRequireUser.mockResolvedValue(user);
      mockHasPermission.mockRejectedValueOnce(new Error("permission failed"));

      await expect(checkResumeAnalysisPermissionService()).rejects.toThrow(
        "permission failed",
      );
    });
  });

  describe("reserveResumeAnalysisUsageService", () => {
    beforeEach(() => {
      mockHasPermission.mockResolvedValue(true);
    });

    it("returns false when the user lacks permissions", async () => {
      mockHasPermission.mockResolvedValueOnce(false);

      await expect(reserveResumeAnalysisUsageService(jobInfoId)).resolves.toBe(
        false,
      );

      expect(mockTryInsertResumeAnalysisDb).not.toHaveBeenCalled();
    });

    it("returns true when a free user successfully reserves quota", async () => {
      const user = makeUser({ id: TEST_USER_ID, plan: "free" });
      mockRequireUser.mockResolvedValue(user);
      mockTryInsertResumeAnalysisDb.mockResolvedValue({ id: "analysis-id" });

      await expect(reserveResumeAnalysisUsageService(jobInfoId)).resolves.toBe(
        true,
      );

      expect(mockTryInsertResumeAnalysisDb).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        jobInfoId,
        limit: PLAN_LIMITS.free.resume_analyses,
      });
    });

    it("returns true when a pro user successfully reserves quota", async () => {
      const user = makeUser({ id: TEST_USER_ID, plan: "pro" });
      mockRequireUser.mockResolvedValue(user);
      mockTryInsertResumeAnalysisDb.mockResolvedValue({ id: "analysis-id" });

      await expect(reserveResumeAnalysisUsageService(jobInfoId)).resolves.toBe(
        true,
      );

      expect(mockTryInsertResumeAnalysisDb).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        jobInfoId,
        limit: PLAN_LIMITS.pro.resume_analyses,
      });
    });

    it("returns false when a user is at the quota limit", async () => {
      mockTryInsertResumeAnalysisDb.mockResolvedValue(null);

      await expect(reserveResumeAnalysisUsageService(jobInfoId)).resolves.toBe(
        false,
      );
    });

    it("rejects when the user is unauthenticated", async () => {
      mockRequireUser.mockRejectedValue(new UnauthorizedError());

      await expect(
        reserveResumeAnalysisUsageService(jobInfoId),
      ).rejects.toBeInstanceOf(UnauthorizedError);

      expect(mockHasPermission).not.toHaveBeenCalled();
      expect(mockTryInsertResumeAnalysisDb).not.toHaveBeenCalled();
    });

    it("propagates unexpected reservation failures", async () => {
      mockTryInsertResumeAnalysisDb.mockRejectedValue(
        new DatabaseError("Reservation failed"),
      );

      await expect(
        reserveResumeAnalysisUsageService(jobInfoId),
      ).rejects.toThrow(DatabaseError);
    });
  });
});
