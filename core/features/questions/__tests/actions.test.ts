jest.mock("@/core/features/questions/service", () => ({
  getQuestionByIdService: jest.fn(),
  getQuestionsService: jest.fn(),
  insertQuestionService: jest.fn(),
}));

jest.mock("@/core/features/questions/permissions", () => ({
  checkQuestionsPermission: jest.fn(),
}));

import {
  canGenerateQuestionsAction,
  getQuestionByIdAction,
  getQuestionsAction,
  insertQuestionAction,
} from "@/core/features/questions/actions";
import { checkQuestionsPermission } from "@/core/features/questions/permissions";
import {
  getQuestionByIdService,
  getQuestionsService,
  insertQuestionService,
} from "@/core/features/questions/service";
import { DatabaseError, UnauthorizedError } from "@/core/dal/errors";
import { makeQuestion } from "@/core/test-utils/factories";

const mockGetQuestionsService = jest.mocked(getQuestionsService);
const mockInsertQuestionService = jest.mocked(insertQuestionService);
const mockGetQuestionByIdService = jest.mocked(getQuestionByIdService);
const mockCheckQuestionsPermission = jest.mocked(checkQuestionsPermission);

describe("question actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getQuestionsAction", () => {
    it("gets questions through the service", async () => {
      const questions = [makeQuestion({ jobInfoId: "job-info-1" })];
      mockGetQuestionsService.mockResolvedValue(questions);

      await expect(getQuestionsAction("job-info-1")).resolves.toBe(questions);

      expect(mockGetQuestionsService).toHaveBeenCalledWith("job-info-1");
    });
  });

  describe("insertQuestionAction", () => {
    it("inserts a question through the service", async () => {
      const question = makeQuestion({
        jobInfoId: "job-info-1",
        difficulty: "medium",
      });
      mockInsertQuestionService.mockResolvedValue(question);

      await expect(
        insertQuestionAction("What did you ship?", "job-info-1", "medium"),
      ).resolves.toBe(question);

      expect(mockInsertQuestionService).toHaveBeenCalledWith(
        "What did you ship?",
        "job-info-1",
        "medium",
      );
    });
  });

  describe("getQuestionByIdAction", () => {
    it("gets one question through the service", async () => {
      const question = {
        ...makeQuestion({ jobInfoId: "job-info-1" }),
        jobInfo: {
          id: "job-info-1",
          userId: "user-1",
        },
      };
      mockGetQuestionByIdService.mockResolvedValue(question);

      await expect(getQuestionByIdAction(question.id)).resolves.toBe(question);

      expect(mockGetQuestionByIdService).toHaveBeenCalledWith(question.id);
    });

    it("bubbles get question failures from the service", async () => {
      const error = new DatabaseError("Failed to fetch question from database");
      mockGetQuestionByIdService.mockRejectedValue(error);

      await expect(getQuestionByIdAction("question-1")).rejects.toBe(error);
    });

    it("bubbles unauthorized failures from the service", async () => {
      const error = new UnauthorizedError();
      mockGetQuestionByIdService.mockRejectedValue(error);

      await expect(getQuestionByIdAction("question-1")).rejects.toBe(error);
    });
  });

  describe("canGenerateQuestionsAction", () => {
    it("returns true when question generation is allowed", async () => {
      mockCheckQuestionsPermission.mockResolvedValueOnce(true);

      await expect(canGenerateQuestionsAction()).resolves.toBe(true);
    });

    it("returns false when question generation is denied", async () => {
      mockCheckQuestionsPermission.mockResolvedValueOnce(false);

      await expect(canGenerateQuestionsAction()).resolves.toBe(false);
    });

    it("bubbles permission check failures", async () => {
      const error = new Error("db down");
      mockCheckQuestionsPermission.mockRejectedValueOnce(error);

      await expect(canGenerateQuestionsAction()).rejects.toBe(error);
    });
  });
});
