jest.mock("next/cache", () => ({
  refresh: jest.fn(),
}));

jest.mock("@arcjet/next", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    protect: jest.fn(),
  })),
  request: jest.fn(),
  tokenBucket: jest.fn((config) => config),
}));

jest.mock("@/core/data/env/server", () => ({
  env: {
    ARCJET_KEY: "test-arcjet-key",
  },
}));

jest.mock("@/core/lib/requireUser", () => ({
  requireUser: jest.fn(),
}));

jest.mock("@/core/features/interviews/dal", () => ({
  getInterviewByIdDal: jest.fn(),
  getInterviewsDal: jest.fn(),
  insertInterviewDal: jest.fn(),
  updateInterviewDal: jest.fn(),
}));

jest.mock("@/core/features/jobInfos/dal", () => ({
  getJobInfoDal: jest.fn(),
}));

jest.mock("@/core/services/ai/interviews", () => ({
  generateAiInterviewFeedback: jest.fn(),
}));

jest.mock("@/core/features/auth/permissions", () => ({
  hasPermission: jest.fn(),
}));

import { refresh } from "next/cache";
import arcjet, { request } from "@arcjet/next";

import {
  NotFoundError,
  PermissionError,
  RateLimitError,
  UnauthorizedError,
} from "@/core/lib/errors";
import { requireUser } from "@/core/lib/requireUser";
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
  checkInterviewPermissionService,
} from "@/core/features/interviews/service";
import { hasPermission } from "@/core/features/auth/permissions";
import { INTERVIEW_ERROR_MESSAGES } from "@/core/features/interviews/errorMessages";
import { getJobInfoDal } from "@/core/features/jobInfos/dal";
import { generateAiInterviewFeedback } from "@/core/services/ai/interviews";
import {
  PERMISSIONS,
  PLAN_LIMIT_MESSAGE,
  RATE_LIMIT_MESSAGE,
} from "@/core/data/constants";
import {
  TEST_OTHER_USER_ID,
  TEST_USER_ID,
  TEST_USER_NAME,
} from "@/core/test-utils/constants";
import {
  makeInterview,
  makeJobInfo,
  makeUser,
} from "@/core/test-utils/factories";

const mockArcjet = jest.mocked(arcjet);
const mockProtect = jest.mocked(
  mockArcjet.mock.results[0].value.protect as jest.Mock,
);
const mockRequest = jest.mocked(request);
const mockRefresh = jest.mocked(refresh);
const mockRequireUser = jest.mocked(requireUser);
const mockGetInterviewByIdDal = jest.mocked(getInterviewByIdDal);
const mockGetInterviewsDal = jest.mocked(getInterviewsDal);
const mockInsertInterviewDal = jest.mocked(insertInterviewDal);
const mockUpdateInterviewDal = jest.mocked(updateInterviewDal);
const mockGetJobInfoDal = jest.mocked(getJobInfoDal);
const mockGenerateAiInterviewFeedback = jest.mocked(
  generateAiInterviewFeedback,
);
const mockHasPermission = jest.mocked(hasPermission);

const SIGNED_IN_USER_ID = TEST_USER_ID;
const OTHER_USER_ID = TEST_OTHER_USER_ID;
const SIGNED_IN_USER_NAME = TEST_USER_NAME;

const allowDecision = { isDenied: () => false };
const denyDecision = { isDenied: () => true };
const requestContext = { ip: "127.0.0.1" };

describe("interview service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireUser.mockResolvedValue(makeUser({ id: SIGNED_IN_USER_ID }));
    mockHasPermission.mockResolvedValue(true);
    mockRequest.mockResolvedValue(requestContext);
    mockProtect.mockResolvedValue(allowDecision);
  });

  describe("getInterviewByIdService", () => {
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
      mockGetInterviewByIdDal.mockResolvedValue(null);

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
  });

  describe("getInterviewsService", () => {
    it("gets interviews for the signed-in user", async () => {
      const interviews = [makeInterview()];
      mockGetInterviewsDal.mockResolvedValue(interviews);

      await expect(getInterviewsService("job-info-1")).resolves.toBe(
        interviews,
      );

      expect(mockGetInterviewsDal).toHaveBeenCalledWith(
        "job-info-1",
        SIGNED_IN_USER_ID,
      );
    });

    it("rejects listing interviews when the user is unauthenticated", async () => {
      mockRequireUser.mockRejectedValue(new UnauthorizedError());

      await expect(getInterviewsService("job-info-1")).rejects.toBeInstanceOf(
        UnauthorizedError,
      );

      expect(mockGetInterviewsDal).not.toHaveBeenCalled();
    });
  });

  describe("createInterviewService", () => {
    it("creates interviews with the default zero duration", async () => {
      const user = makeUser({ id: SIGNED_IN_USER_ID });
      mockRequireUser.mockResolvedValue(user);
      const jobInfo = makeJobInfo({ id: "job-info-1", userId: user.id });
      const interview = makeInterview({ jobInfoId: jobInfo.id });
      mockGetJobInfoDal.mockResolvedValue(jobInfo);
      mockInsertInterviewDal.mockResolvedValue(interview);

      await expect(createInterviewService(jobInfo.id)).resolves.toBe(interview);

      expect(mockHasPermission).toHaveBeenCalledWith(
        PERMISSIONS.INTERVIEWS,
        user,
      );
      expect(mockProtect).toHaveBeenCalledWith(requestContext, {
        userId: user.id,
        requested: 1,
      });
      expect(mockGetJobInfoDal).toHaveBeenCalledWith(jobInfo.id, user.id);
      expect(mockInsertInterviewDal).toHaveBeenCalledWith({
        jobInfoId: jobInfo.id,
        duration: "00:00:00",
      });
    });

    it("rejects creation when the user is unauthenticated", async () => {
      mockRequireUser.mockRejectedValue(new UnauthorizedError());

      await expect(createInterviewService("job-info-1")).rejects.toBeInstanceOf(
        UnauthorizedError,
      );

      expect(mockHasPermission).not.toHaveBeenCalled();
      expect(mockInsertInterviewDal).not.toHaveBeenCalled();
    });

    it("rejects creation when the plan limit is reached", async () => {
      mockHasPermission.mockResolvedValue(false);

      await expect(createInterviewService("job-info-1")).rejects.toEqual(
        new PermissionError(PLAN_LIMIT_MESSAGE),
      );

      expect(mockProtect).not.toHaveBeenCalled();
      expect(mockInsertInterviewDal).not.toHaveBeenCalled();
    });

    it("rejects creation when Arcjet denies the request", async () => {
      mockProtect.mockResolvedValue(denyDecision);

      await expect(createInterviewService("job-info-1")).rejects.toEqual(
        new RateLimitError(RATE_LIMIT_MESSAGE),
      );

      expect(mockGetJobInfoDal).not.toHaveBeenCalled();
      expect(mockInsertInterviewDal).not.toHaveBeenCalled();
    });

    it("rejects creation when the job info is inaccessible", async () => {
      mockGetJobInfoDal.mockResolvedValue(
        null as unknown as Awaited<ReturnType<typeof getJobInfoDal>>,
      );

      await expect(createInterviewService("job-info-1")).rejects.toBeInstanceOf(
        NotFoundError,
      );

      expect(mockInsertInterviewDal).not.toHaveBeenCalled();
    });
  });

  describe("updateInterviewService", () => {
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
      mockGetInterviewByIdDal.mockResolvedValue(null);

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
  });

  describe("generateInterviewFeedbackService", () => {
    it("generates and stores feedback for a completed owned interview", async () => {
      mockRequireUser.mockResolvedValue(
        makeUser({ id: SIGNED_IN_USER_ID, name: SIGNED_IN_USER_NAME }),
      );

      const interview = makeInterview({
        humeChatId: "chat-test-1",
        jobInfo: makeJobInfo({ userId: SIGNED_IN_USER_ID }),
      });
      mockGetInterviewByIdDal.mockResolvedValue(interview);
      mockGenerateAiInterviewFeedback.mockResolvedValue("Useful feedback");

      await expect(
        generateInterviewFeedbackService(interview.id),
      ).resolves.toBe("Useful feedback");

      expect(mockProtect).toHaveBeenCalledWith(requestContext, {
        userId: SIGNED_IN_USER_ID,
        requested: 1,
      });
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

    it("rejects feedback generation when the user is unauthenticated", async () => {
      mockRequireUser.mockRejectedValue(new UnauthorizedError());

      await expect(
        generateInterviewFeedbackService("interview-1"),
      ).rejects.toBeInstanceOf(UnauthorizedError);

      expect(mockProtect).not.toHaveBeenCalled();
      expect(mockGetInterviewByIdDal).not.toHaveBeenCalled();
      expect(mockGenerateAiInterviewFeedback).not.toHaveBeenCalled();
    });

    it("rejects feedback generation when Arcjet denies the request", async () => {
      mockProtect.mockResolvedValue(denyDecision);

      await expect(
        generateInterviewFeedbackService("interview-1"),
      ).rejects.toEqual(new RateLimitError(RATE_LIMIT_MESSAGE));

      expect(mockGenerateAiInterviewFeedback).not.toHaveBeenCalled();
      expect(mockUpdateInterviewDal).not.toHaveBeenCalled();
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

    it("rejects feedback generation when no accessible interview exists", async () => {
      mockGetInterviewByIdDal.mockResolvedValue(null);

      await expect(
        generateInterviewFeedbackService("interview-1"),
      ).rejects.toBeInstanceOf(PermissionError);

      expect(mockGenerateAiInterviewFeedback).not.toHaveBeenCalled();
      expect(mockUpdateInterviewDal).not.toHaveBeenCalled();
    });

    it("throws when AI feedback generation returns no feedback", async () => {
      const interview = makeInterview({
        humeChatId: "chat-test-1",
        jobInfo: makeJobInfo({ userId: SIGNED_IN_USER_ID }),
      });
      mockGetInterviewByIdDal.mockResolvedValue(interview);
      mockGenerateAiInterviewFeedback.mockResolvedValue("");

      await expect(
        generateInterviewFeedbackService(interview.id),
      ).rejects.toThrow(INTERVIEW_ERROR_MESSAGES.feedbackGenerationFailed);

      expect(mockUpdateInterviewDal).not.toHaveBeenCalled();
    });
  });

  describe("checkInterviewPermissionService", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("passes correct permission to hasPermission", async () => {
      const user = makeUser({ id: SIGNED_IN_USER_ID });
      mockRequireUser.mockResolvedValue(user);
      mockHasPermission.mockResolvedValueOnce(true);

      await checkInterviewPermissionService();

      expect(mockHasPermission).toHaveBeenCalledWith(
        PERMISSIONS.INTERVIEWS,
        user,
      );
    });

    it("returns true when hasPermission resolves true", async () => {
      const user = makeUser({ id: SIGNED_IN_USER_ID });
      mockRequireUser.mockResolvedValue(user);
      mockHasPermission.mockResolvedValueOnce(true);

      await expect(checkInterviewPermissionService()).resolves.toBe(true);

      expect(mockHasPermission).toHaveBeenCalledWith(
        PERMISSIONS.INTERVIEWS,
        user,
      );
    });

    it("rejects when the user is unauthenticated", async () => {
      mockRequireUser.mockRejectedValue(new UnauthorizedError());

      await expect(checkInterviewPermissionService()).rejects.toBeInstanceOf(
        UnauthorizedError,
      );

      expect(mockHasPermission).not.toHaveBeenCalled();
    });

    it("returns false when hasPermission resolves false", async () => {
      const user = makeUser({ id: SIGNED_IN_USER_ID });
      mockRequireUser.mockResolvedValue(user);
      mockHasPermission.mockResolvedValueOnce(false);

      await expect(checkInterviewPermissionService()).resolves.toBe(false);

      expect(mockHasPermission).toHaveBeenCalledWith(
        PERMISSIONS.INTERVIEWS,
        user,
      );
    });

    it("throws when hasPermission rejects", async () => {
      const user = makeUser({ id: SIGNED_IN_USER_ID });
      mockRequireUser.mockResolvedValue(user);
      mockHasPermission.mockRejectedValue(
        new PermissionError(PLAN_LIMIT_MESSAGE),
      );

      await expect(checkInterviewPermissionService()).rejects.toThrow(
        PLAN_LIMIT_MESSAGE,
      );

      expect(mockHasPermission).toHaveBeenCalledWith(
        PERMISSIONS.INTERVIEWS,
        user,
      );
    });
  });
});
