jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserAction: jest.fn(),
}));

jest.mock("@/core/features/jobInfos/dal", () => ({
  getJobInfoDal: jest.fn(),
}));

jest.mock("@/core/features/questions/dal", () => ({
  getQuestionByIdDal: jest.fn(),
  getQuestionsDal: jest.fn(),
  insertQuestionDal: jest.fn(),
}));

import { getCurrentUserAction } from "@/core/features/auth/actions";
import { getJobInfoDal } from "@/core/features/jobInfos/dal";
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
import { NotFoundError, UnauthorizedError } from "@/core/dal/errors";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeJobInfo, makeQuestion } from "@/core/test-utils/factories";
import { makeCurrentUser } from "@/core/test-utils/factories/user";

const mockGetCurrentUser = jest.mocked(getCurrentUserAction);
const mockGetJobInfoDal = jest.mocked(getJobInfoDal);
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

  it("gets questions only after verifying job info ownership", async () => {
    const jobInfo = makeJobInfo({
      id: "job-info-1",
      userId: SIGNED_IN_USER_ID,
    });
    const questions = [makeQuestion({ jobInfoId: jobInfo.id })];
    mockGetJobInfoDal.mockResolvedValue(jobInfo);
    mockGetQuestionsDal.mockResolvedValue(questions);

    await expect(getQuestionsService(jobInfo.id)).resolves.toBe(questions);

    expect(mockGetJobInfoDal).toHaveBeenCalledWith(
      jobInfo.id,
      SIGNED_IN_USER_ID,
    );
    expect(mockGetQuestionsDal).toHaveBeenCalledWith(jobInfo.id);
  });

  it("rejects getting questions when the job info is not owned", async () => {
    mockGetJobInfoDal.mockResolvedValue(undefined);

    await expect(getQuestionsService("job-info-1")).rejects.toBeInstanceOf(
      NotFoundError,
    );

    expect(mockGetQuestionsDal).not.toHaveBeenCalled();
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

  it("inserts a question only after verifying job info ownership", async () => {
    const text = "What tradeoff would you make?";
    const jobInfoId = "job-info-1";
    const difficulty = "hard";
    const jobInfo = makeJobInfo({ id: jobInfoId, userId: SIGNED_IN_USER_ID });

    const question = makeQuestion({ text, jobInfoId, difficulty });
    mockGetJobInfoDal.mockResolvedValue(jobInfo);
    mockInsertQuestionDal.mockResolvedValue(question);

    await expect(
      insertQuestionService(text, jobInfoId, difficulty),
    ).resolves.toBe(question);

    expect(mockGetJobInfoDal).toHaveBeenCalledWith(
      jobInfoId,
      SIGNED_IN_USER_ID,
    );
    expect(mockInsertQuestionDal).toHaveBeenCalledWith({
      text,
      jobInfoId,
      difficulty,
    });
  });

  it("rejects inserting a question when the job info is not owned", async () => {
    mockGetJobInfoDal.mockResolvedValue(undefined);

    await expect(
      insertQuestionService(
        "What tradeoff would you make?",
        "job-info-1",
        "hard",
      ),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(mockInsertQuestionDal).not.toHaveBeenCalled();
  });

  it("rejects inserting a question when unauthenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(makeCurrentUser({ userId: null }));

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
