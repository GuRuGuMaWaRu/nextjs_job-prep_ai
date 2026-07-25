jest.mock("@/core/features/auth/helpers", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/core/features/questions/dal", () => ({
  getQuestionByIdDal: jest.fn(),
  getQuestionsDal: jest.fn(),
  insertQuestionDal: jest.fn(),
}));

import { getCurrentUser } from "@/core/features/auth/helpers";
import {
  getQuestionByIdDal,
  getQuestionsDal,
  insertQuestionDal,
} from "@/core/features/questions/dal";
import {
  getQuestionByIdService,
  getQuestionsService,
  insertQuestionService,
} from "@/core/features/questions/service";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeQuestion } from "@/core/test-utils/factories";
import { makeUser } from "@/core/test-utils/factories/user";

const mockGetCurrentUser = jest.mocked(getCurrentUser);
const mockGetQuestionsDal = jest.mocked(getQuestionsDal);
const mockGetQuestionByIdDal = jest.mocked(getQuestionByIdDal);
const mockInsertQuestionDal = jest.mocked(insertQuestionDal);

describe("question services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({
      user: makeUser({ id: TEST_USER_ID }),
    });
  });

  describe("getQuestionsService", () => {
    it("gets questions for a job info without requiring authentication", async () => {
      const questions = [makeQuestion({ jobInfoId: "job-info-1" })];
      mockGetQuestionsDal.mockResolvedValue(questions);

      await expect(getQuestionsService("job-info-1")).resolves.toBe(questions);

      expect(mockGetCurrentUser).not.toHaveBeenCalled();
      expect(mockGetQuestionsDal).toHaveBeenCalledWith("job-info-1");
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
  });

  describe("insertQuestionService", () => {
    it("inserts a question with its job info and difficulty", async () => {
      const text = "What tradeoff would you make?";
      const jobInfoId = "job-info-1";
      const difficulty = "hard";

      const question = makeQuestion({ text, jobInfoId, difficulty });
      mockInsertQuestionDal.mockResolvedValue(question);

      await expect(
        insertQuestionService(text, jobInfoId, difficulty),
      ).resolves.toBe(question);

      expect(mockInsertQuestionDal).toHaveBeenCalledWith({
        text,
        jobInfoId,
        difficulty,
      });
    });
  });
});
