jest.mock("@/core/features/questions/service", () => ({
  getQuestionByIdService: jest.fn(),
  getQuestionsService: jest.fn(),
  insertQuestionService: jest.fn(),
}));

import {
  getQuestionByIdAction,
  getQuestionsAction,
  insertQuestionAction,
} from "@/core/features/questions/actions";
import {
  getQuestionByIdService,
  getQuestionsService,
  insertQuestionService,
} from "@/core/features/questions/service";
import { makeQuestion } from "@/core/test-utils/factories";

const mockGetQuestionsService = jest.mocked(getQuestionsService);
const mockInsertQuestionService = jest.mocked(insertQuestionService);
const mockGetQuestionByIdService = jest.mocked(getQuestionByIdService);

describe("question actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("gets questions through the service", async () => {
    const questions = [makeQuestion({ jobInfoId: "job-info-1" })];
    mockGetQuestionsService.mockResolvedValue(questions);

    await expect(getQuestionsAction("job-info-1")).resolves.toBe(questions);

    expect(mockGetQuestionsService).toHaveBeenCalledWith("job-info-1");
  });

  it("wraps get questions failures with job info context", async () => {
    const cause = new Error("database failed");
    mockGetQuestionsService.mockRejectedValue(cause);

    await expect(getQuestionsAction("job-info-1")).rejects.toMatchObject({
      message: 'Failed to get questions for job info "job-info-1".',
      cause,
    });
  });

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

  it("wraps insert failures with job info and difficulty context", async () => {
    const cause = new Error("insert failed");
    mockInsertQuestionService.mockRejectedValue(cause);

    await expect(
      insertQuestionAction("What did you ship?", "job-info-1", "hard"),
    ).rejects.toMatchObject({
      message:
        'Failed to insert question for job info "job-info-1" with difficulty "hard".',
      cause,
    });
  });

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

  it("wraps get question failures with question context", async () => {
    const cause = new Error("lookup failed");
    mockGetQuestionByIdService.mockRejectedValue(cause);

    await expect(getQuestionByIdAction("question-1")).rejects.toMatchObject({
      message: 'Failed to get question "question-1".',
      cause,
    });
  });
});
