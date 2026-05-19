jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserAction: jest.fn(),
}));

jest.mock("@/core/features/questions/dal", () => ({
  getQuestionByIdDal: jest.fn(),
  getQuestionsDal: jest.fn(),
  insertQuestionDal: jest.fn(),
}));

import { getCurrentUserAction } from "@/core/features/auth/actions";
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
import { makeCurrentUser } from "@/core/test-utils/factories/user";

const mockGetCurrentUser = jest.mocked(getCurrentUserAction);
const mockGetQuestionsDal = jest.mocked(getQuestionsDal);
const mockGetQuestionByIdDal = jest.mocked(getQuestionByIdDal);
const mockInsertQuestionDal = jest.mocked(insertQuestionDal);

const SIGNED_IN_USER_ID = TEST_USER_ID;

describe("question service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(
      makeCurrentUser({ userId: SIGNED_IN_USER_ID }),
    );
  });

  it("gets questions for a job info without requiring authentication", async () => {
    const questions = [makeQuestion({ jobInfoId: "job-info-1" })];
    mockGetQuestionsDal.mockResolvedValue(questions);

    await expect(getQuestionsService("job-info-1")).resolves.toBe(questions);

    expect(mockGetCurrentUser).not.toHaveBeenCalled();
    expect(mockGetQuestionsDal).toHaveBeenCalledWith("job-info-1");
  });

  it("gets one question using the signed-in user id for ownership filtering", async () => {
    const question = {
      ...makeQuestion(),
      jobInfo: { id: "job-info-1", userId: SIGNED_IN_USER_ID },
    };
    mockGetQuestionByIdDal.mockResolvedValue(question);

    await expect(getQuestionByIdService(question.id)).resolves.toBe(question);

    expect(mockGetQuestionByIdDal).toHaveBeenCalledWith(
      question.id,
      SIGNED_IN_USER_ID,
    );
  });

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
