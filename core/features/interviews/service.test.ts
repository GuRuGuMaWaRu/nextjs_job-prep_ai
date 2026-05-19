jest.mock("next/cache", () => ({
  refresh: jest.fn(),
}));

jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserAction: jest.fn(),
  getCurrentUserWithProfileAction: jest.fn(),
}));

jest.mock("@/core/features/interviews/dal", () => ({
  getInterviewByIdDal: jest.fn(),
  getInterviewsDal: jest.fn(),
  insertInterviewDal: jest.fn(),
  updateInterviewDal: jest.fn(),
}));

jest.mock("@/core/services/ai/interviews", () => ({
  generateAiInterviewFeedback: jest.fn(),
}));

import { refresh } from "next/cache";

import { PermissionError } from "@/core/dal/errors";
import {
  getCurrentUserAction,
  getCurrentUserWithProfileAction,
} from "@/core/features/auth/actions";
import {
  getInterviewByIdDal,
  getInterviewsDal,
  insertInterviewDal,
  updateInterviewDal,
} from "@/core/features/interviews/dal";
import {
  createInterviewService,
  generateInterviewFeedbackService,
  getInterviewByIdService,
  getInterviewsService,
  updateInterviewService,
} from "@/core/features/interviews/service";
import { INTERVIEW_SERVICE_ERRORS } from "@/core/features/interviews/serviceErrors";
import { generateAiInterviewFeedback } from "@/core/services/ai/interviews";
import {
  TEST_OTHER_USER_ID,
  TEST_USER_ID,
  TEST_USER_NAME,
} from "@/core/test-utils/constants";
import { makeInterview, makeJobInfo, makeUser } from "@/core/test-utils/factories";
import { makeCurrentUser } from "@/core/test-utils/factories/user";

const mockRefresh = jest.mocked(refresh);
const mockGetCurrentUser = jest.mocked(getCurrentUserAction);
const mockGetCurrentUserWithProfile = jest.mocked(getCurrentUserWithProfileAction);
const mockGetInterviewByIdDal = jest.mocked(getInterviewByIdDal);
const mockGetInterviewsDal = jest.mocked(getInterviewsDal);
const mockInsertInterviewDal = jest.mocked(insertInterviewDal);
const mockUpdateInterviewDal = jest.mocked(updateInterviewDal);
const mockGenerateAiInterviewFeedback = jest.mocked(
  generateAiInterviewFeedback,
);

const SIGNED_IN_USER_ID = TEST_USER_ID;
const OTHER_USER_ID = TEST_OTHER_USER_ID;
const SIGNED_IN_USER_NAME = TEST_USER_NAME;

describe("interview service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(
      makeCurrentUser({ userId: SIGNED_IN_USER_ID }),
    );
    mockGetCurrentUserWithProfile.mockResolvedValue(
      makeCurrentUser({
        userId: SIGNED_IN_USER_ID,
        user: makeUser({ id: SIGNED_IN_USER_ID, name: SIGNED_IN_USER_NAME }),
      }),
    );
  });

  it("returns an interview when the requested user owns its job info", async () => {
    const interview = makeInterview({
      jobInfo: makeJobInfo({ userId: SIGNED_IN_USER_ID }),
    });
    mockGetInterviewByIdDal.mockResolvedValue(interview);

    await expect(
      getInterviewByIdService(interview.id, SIGNED_IN_USER_ID),
    ).resolves.toBe(interview);
  });

  it("returns null when the interview does not exist", async () => {
    mockGetInterviewByIdDal.mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof getInterviewByIdDal>>,
    );

    await expect(
      getInterviewByIdService("interview-1", SIGNED_IN_USER_ID),
    ).resolves.toBe(null);
  });

  it("returns null when another user owns the interview job info", async () => {
    const interview = makeInterview({
      jobInfo: makeJobInfo({ userId: OTHER_USER_ID }),
    });
    mockGetInterviewByIdDal.mockResolvedValue(interview);

    await expect(
      getInterviewByIdService(interview.id, SIGNED_IN_USER_ID),
    ).resolves.toBe(null);
  });

  it("gets interviews for a job info and user", async () => {
    const interviews = [makeInterview()];
    mockGetInterviewsDal.mockResolvedValue(interviews);

    await expect(
      getInterviewsService("job-info-1", SIGNED_IN_USER_ID),
    ).resolves.toBe(interviews);

    expect(mockGetInterviewsDal).toHaveBeenCalledWith(
      "job-info-1",
      SIGNED_IN_USER_ID,
    );
  });

  it("creates interviews with the default zero duration", async () => {
    const interview = makeInterview({ jobInfoId: "job-info-1" });
    mockInsertInterviewDal.mockResolvedValue(interview);

    await expect(createInterviewService("job-info-1")).resolves.toBe(interview);

    expect(mockInsertInterviewDal).toHaveBeenCalledWith({
      jobInfoId: "job-info-1",
      duration: "00:00:00",
    });
  });

  it("updates an interview when the signed-in user owns it", async () => {
    const interview = makeInterview({
      jobInfo: makeJobInfo({ userId: SIGNED_IN_USER_ID }),
    });
    const update = { duration: "00:14:30" };
    const updatedInterview = { ...interview, ...update };
    mockGetInterviewByIdDal.mockResolvedValue(interview);
    mockUpdateInterviewDal.mockResolvedValue(updatedInterview);

    await expect(updateInterviewService(interview.id, update)).resolves.toBe(
      updatedInterview,
    );

    expect(mockUpdateInterviewDal).toHaveBeenCalledWith(interview.id, update);
  });

  it("rejects interview updates when no accessible interview exists", async () => {
    mockGetInterviewByIdDal.mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof getInterviewByIdDal>>,
    );

    await expect(
      updateInterviewService("interview-1", { duration: "00:01:00" }),
    ).rejects.toBeInstanceOf(PermissionError);

    expect(mockUpdateInterviewDal).not.toHaveBeenCalled();
  });

  it("rejects interview updates owned by a different user", async () => {
    const interview = makeInterview({
      jobInfo: makeJobInfo({ userId: OTHER_USER_ID }),
    });
    mockGetInterviewByIdDal.mockResolvedValue(interview);

    await expect(
      updateInterviewService(interview.id, { duration: "00:01:00" }),
    ).rejects.toBeInstanceOf(PermissionError);

    expect(mockUpdateInterviewDal).not.toHaveBeenCalled();
  });

  it("generates and stores feedback for a completed owned interview", async () => {
    const interview = makeInterview({
      humeChatId: "chat-test-1",
      jobInfo: makeJobInfo({ userId: SIGNED_IN_USER_ID }),
    });
    mockGetInterviewByIdDal.mockResolvedValue(interview);
    mockGenerateAiInterviewFeedback.mockResolvedValue("Useful feedback");

    await expect(generateInterviewFeedbackService(interview.id)).resolves.toBe(
      "Useful feedback",
    );

    expect(mockGenerateAiInterviewFeedback).toHaveBeenCalledWith({
      humeChatId: "chat-test-1",
      jobInfo: interview.jobInfo,
      userName: SIGNED_IN_USER_NAME,
    });
    expect(mockUpdateInterviewDal).toHaveBeenCalledWith(interview.id, {
      feedback: "Useful feedback",
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("rejects feedback generation when the interview is not completed", async () => {
    const interview = makeInterview({
      humeChatId: null,
      jobInfo: makeJobInfo({ userId: SIGNED_IN_USER_ID }),
    });
    mockGetInterviewByIdDal.mockResolvedValue(interview);

    await expect(
      generateInterviewFeedbackService(interview.id),
    ).rejects.toBeInstanceOf(PermissionError);

    expect(mockGenerateAiInterviewFeedback).not.toHaveBeenCalled();
  });

  it("throws when AI feedback generation returns no feedback", async () => {
    const interview = makeInterview({
      humeChatId: "chat-test-1",
      jobInfo: makeJobInfo({ userId: SIGNED_IN_USER_ID }),
    });
    mockGetInterviewByIdDal.mockResolvedValue(interview);
    mockGenerateAiInterviewFeedback.mockResolvedValue("");

    await expect(generateInterviewFeedbackService(interview.id)).rejects.toThrow(
      INTERVIEW_SERVICE_ERRORS.feedbackGenerationFailed,
    );

    expect(mockUpdateInterviewDal).not.toHaveBeenCalled();
  });
});
