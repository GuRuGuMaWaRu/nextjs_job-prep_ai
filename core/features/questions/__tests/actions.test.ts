jest.mock("@/core/features/questions/service", () => ({
  getQuestionByIdService: jest.fn(),
  getQuestionsService: jest.fn(),
  insertQuestionService: jest.fn(),
  checkQuestionsPermissionService: jest.fn(),
}));

import {
  canGenerateQuestionsAction,
  getQuestionByIdAction,
  getQuestionsAction,
  insertQuestionAction,
} from "@/core/features/questions/actions";
import {
  checkQuestionsPermissionService,
  getQuestionByIdService,
  getQuestionsService,
  insertQuestionService,
} from "@/core/features/questions/service";
import { QUESTION_SERVICE_ERRORS } from "@/core/features/questions/serviceErrors";
import {
  DatabaseError,
  NotFoundError,
  UnauthorizedError,
} from "@/core/lib/errors";
import { makeQuestion } from "@/core/test-utils/factories";

const mockGetQuestionsService = jest.mocked(getQuestionsService);
const mockInsertQuestionService = jest.mocked(insertQuestionService);
const mockGetQuestionByIdService = jest.mocked(getQuestionByIdService);
const mockCheckQuestionsPermissionService = jest.mocked(
  checkQuestionsPermissionService,
);

const JOB_INFO_ID = "00000000-0000-4000-8000-000000000001";
const QUESTION_ID = "00000000-0000-4002-8000-000000000001";
const INVALID_ID = "not-a-uuid";

describe("question actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getQuestionsAction", () => {
    it("gets questions through the service", async () => {
      const questions = [makeQuestion({ jobInfoId: JOB_INFO_ID })];
      mockGetQuestionsService.mockResolvedValue(questions);

      await expect(getQuestionsAction(JOB_INFO_ID)).resolves.toBe(questions);

      expect(mockGetQuestionsService).toHaveBeenCalledWith(JOB_INFO_ID);
    });

    it("returns an empty list for a non-UUID jobInfoId without calling the service", async () => {
      await expect(getQuestionsAction(INVALID_ID)).resolves.toEqual([]);

      expect(mockGetQuestionsService).not.toHaveBeenCalled();
    });
  });

  describe("insertQuestionAction", () => {
    it("inserts a question through the service", async () => {
      const question = makeQuestion({
        jobInfoId: JOB_INFO_ID,
        difficulty: "medium",
      });
      mockInsertQuestionService.mockResolvedValue(question);

      await expect(
        insertQuestionAction("What did you ship?", JOB_INFO_ID, "medium"),
      ).resolves.toBe(question);

      expect(mockInsertQuestionService).toHaveBeenCalledWith(
        "What did you ship?",
        JOB_INFO_ID,
        "medium",
      );
    });

    it("throws NotFoundError for a non-UUID jobInfoId without calling the service", async () => {
      await expect(
        insertQuestionAction("What did you ship?", INVALID_ID, "medium"),
      ).rejects.toEqual(
        new NotFoundError(QUESTION_SERVICE_ERRORS.jobInfoNotFoundOrNoAccess),
      );

      expect(mockInsertQuestionService).not.toHaveBeenCalled();
    });
  });

  describe("getQuestionByIdAction", () => {
    it("gets one question through the service", async () => {
      const question = {
        ...makeQuestion({ jobInfoId: JOB_INFO_ID }),
        jobInfo: {
          id: JOB_INFO_ID,
          userId: "user-1",
        },
      };
      mockGetQuestionByIdService.mockResolvedValue(question);

      await expect(getQuestionByIdAction(question.id)).resolves.toBe(question);

      expect(mockGetQuestionByIdService).toHaveBeenCalledWith(question.id);
    });

    it("returns null for a non-UUID id without calling the service", async () => {
      await expect(getQuestionByIdAction(INVALID_ID)).resolves.toBeNull();

      expect(mockGetQuestionByIdService).not.toHaveBeenCalled();
    });

    it("bubbles get question failures from the service", async () => {
      const error = new DatabaseError("Failed to fetch question from database");
      mockGetQuestionByIdService.mockRejectedValue(error);

      await expect(getQuestionByIdAction(QUESTION_ID)).rejects.toBe(error);
    });

    it("bubbles unauthorized failures from the service", async () => {
      const error = new UnauthorizedError();
      mockGetQuestionByIdService.mockRejectedValue(error);

      await expect(getQuestionByIdAction(QUESTION_ID)).rejects.toBe(error);
    });
  });

  describe("canGenerateQuestionsAction", () => {
    it("returns true when question generation is allowed", async () => {
      mockCheckQuestionsPermissionService.mockResolvedValueOnce(true);

      await expect(canGenerateQuestionsAction()).resolves.toBe(true);

      expect(mockCheckQuestionsPermissionService).toHaveBeenCalledWith();
    });

    it("returns false when question generation is denied", async () => {
      mockCheckQuestionsPermissionService.mockResolvedValueOnce(false);

      await expect(canGenerateQuestionsAction()).resolves.toBe(false);
    });

    it("bubbles permission check failures", async () => {
      const error = new Error("db down");
      mockCheckQuestionsPermissionService.mockRejectedValueOnce(error);

      await expect(canGenerateQuestionsAction()).rejects.toBe(error);
    });
  });
});
