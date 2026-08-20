jest.mock("@/core/lib/requireUser", () => ({
  requireUser: jest.fn(),
}));

jest.mock("@/core/features/questions/dal", () => ({
  getQuestionByIdDal: jest.fn(),
  getQuestionsDal: jest.fn(),
  insertQuestionDal: jest.fn(),
}));

jest.mock("@/core/features/jobInfos/dal", () => ({
  getJobInfoDal: jest.fn(),
}));

jest.mock("@/core/features/auth/permissions", () => ({
  hasPermission: jest.fn(),
}));

import { NotFoundError, UnauthorizedError } from "@/core/lib/errors";
import { requireUser } from "@/core/lib/requireUser";
import {
  getQuestionByIdDal,
  getQuestionsDal,
  insertQuestionDal,
} from "@/core/features/questions/dal";
import { getJobInfoDal } from "@/core/features/jobInfos/dal";
import {
  getQuestionByIdService,
  getQuestionsService,
  insertQuestionService,
  checkQuestionsPermissionService,
} from "@/core/features/questions/service";
import { hasPermission } from "@/core/features/auth/permissions";
import { PERMISSIONS } from "@/core/data/constants";

import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeJobInfo, makeQuestion } from "@/core/test-utils/factories";
import { makeUser } from "@/core/test-utils/factories/user";

const mockRequireUser = jest.mocked(requireUser);
const mockGetQuestionsDal = jest.mocked(getQuestionsDal);
const mockGetQuestionByIdDal = jest.mocked(getQuestionByIdDal);
const mockInsertQuestionDal = jest.mocked(insertQuestionDal);
const mockGetJobInfoDal = jest.mocked(getJobInfoDal);
const mockHasPermission = jest.mocked(hasPermission);

describe("question services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireUser.mockResolvedValue(makeUser({ id: TEST_USER_ID }));
  });

  describe("getQuestionsService", () => {
    it("gets questions for a job info using the signed-in user id", async () => {
      const questions = [makeQuestion({ jobInfoId: "job-info-1" })];
      mockGetQuestionsDal.mockResolvedValue(questions);

      await expect(getQuestionsService("job-info-1")).resolves.toBe(questions);

      expect(mockGetQuestionsDal).toHaveBeenCalledWith(
        "job-info-1",
        TEST_USER_ID,
      );
    });

    it("rejects when the user is not signed in", async () => {
      mockRequireUser.mockRejectedValue(new UnauthorizedError());

      await expect(getQuestionsService("job-info-1")).rejects.toBeInstanceOf(
        UnauthorizedError,
      );

      expect(mockGetQuestionsDal).not.toHaveBeenCalled();
    });
  });

  describe("getQuestionByIdService", () => {
    it("gets one question using the signed-in user id for ownership filtering", async () => {
      const question = {
        ...makeQuestion(),
        jobInfo: { id: "job-info-1", userId: TEST_USER_ID },
      };
      mockGetQuestionByIdDal.mockResolvedValue(question);

      await expect(getQuestionByIdService(question.id)).resolves.toBe(question);

      expect(mockGetQuestionByIdDal).toHaveBeenCalledWith(
        question.id,
        TEST_USER_ID,
      );
    });

    it("rejects when the user is not signed in", async () => {
      mockRequireUser.mockRejectedValue(new UnauthorizedError());

      await expect(getQuestionByIdService("question-1")).rejects.toBeInstanceOf(
        UnauthorizedError,
      );

      expect(mockGetQuestionByIdDal).not.toHaveBeenCalled();
    });
  });

  describe("insertQuestionService", () => {
    it("inserts a question after verifying job info ownership", async () => {
      const text = "What tradeoff would you make?";
      const jobInfoId = "job-info-1";
      const difficulty = "hard";
      const jobInfo = makeJobInfo({ id: jobInfoId, userId: TEST_USER_ID });
      const question = makeQuestion({ text, jobInfoId, difficulty });

      mockGetJobInfoDal.mockResolvedValue(jobInfo);
      mockInsertQuestionDal.mockResolvedValue(question);

      await expect(
        insertQuestionService(text, jobInfoId, difficulty),
      ).resolves.toBe(question);

      expect(mockGetJobInfoDal).toHaveBeenCalledWith(jobInfoId, TEST_USER_ID);
      expect(mockInsertQuestionDal).toHaveBeenCalledWith({
        text,
        jobInfoId,
        difficulty,
      });
    });

    it("rejects insert when the job info is not accessible", async () => {
      mockGetJobInfoDal.mockResolvedValue(
        null as unknown as Awaited<ReturnType<typeof getJobInfoDal>>,
      );

      await expect(
        insertQuestionService(
          "What tradeoff would you make?",
          "job-info-1",
          "hard",
        ),
      ).rejects.toBeInstanceOf(NotFoundError);

      expect(mockInsertQuestionDal).not.toHaveBeenCalled();
    });

    it("rejects when the user is not signed in", async () => {
      mockRequireUser.mockRejectedValue(new UnauthorizedError());

      await expect(
        insertQuestionService(
          "What tradeoff would you make?",
          "job-info-1",
          "hard",
        ),
      ).rejects.toBeInstanceOf(UnauthorizedError);

      expect(mockGetJobInfoDal).not.toHaveBeenCalled();
      expect(mockInsertQuestionDal).not.toHaveBeenCalled();
    });
  });

  describe("checkQuestionsPermissionService", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("passes correct permission to hasPermission", async () => {
      const user = makeUser({ id: TEST_USER_ID });
      mockRequireUser.mockResolvedValue(user);
      mockHasPermission.mockResolvedValueOnce(true);

      await checkQuestionsPermissionService();

      expect(mockHasPermission).toHaveBeenCalledWith(
        PERMISSIONS.QUESTIONS,
        user,
      );
    });

    it("returns true when hasPermission resolves true", async () => {
      const user = makeUser({ id: TEST_USER_ID });
      mockRequireUser.mockResolvedValue(user);
      mockHasPermission.mockResolvedValueOnce(true);

      await expect(checkQuestionsPermissionService()).resolves.toBe(true);
    });

    it("returns false when hasPermission resolves false", async () => {
      const user = makeUser({ id: TEST_USER_ID });
      mockRequireUser.mockResolvedValue(user);
      mockHasPermission.mockResolvedValueOnce(false);

      await expect(checkQuestionsPermissionService()).resolves.toBe(false);
    });

    it("throws when hasPermission rejects", async () => {
      const user = makeUser({ id: TEST_USER_ID });
      mockRequireUser.mockResolvedValue(user);
      mockHasPermission.mockRejectedValueOnce(new Error("permission failed"));

      await expect(checkQuestionsPermissionService()).rejects.toThrow(
        "permission failed",
      );
    });

    it("rejects when the user is unauthenticated", async () => {
      mockRequireUser.mockRejectedValue(new UnauthorizedError());

      await expect(checkQuestionsPermissionService()).rejects.toBeInstanceOf(
        UnauthorizedError,
      );

      expect(mockHasPermission).not.toHaveBeenCalled();
    });
  });
});
