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

jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserAction: jest.fn(),
}));

jest.mock("@/core/features/interviews/permissions", () => ({
  checkInterviewPermission: jest.fn(),
}));

jest.mock("@/core/features/jobInfos/actions", () => ({
  getJobInfoAction: jest.fn(),
}));

jest.mock("@/core/features/interviews/service", () => ({
  createInterviewService: jest.fn(),
  generateInterviewFeedbackService: jest.fn(),
  getInterviewByIdService: jest.fn(),
  getInterviewsService: jest.fn(),
  updateInterviewService: jest.fn(),
}));

import {
  DatabaseError,
  PermissionError,
  UnauthorizedError,
} from "@/core/dal/errors";
import arcjet, { request } from "@arcjet/next";
import { getCurrentUserAction } from "@/core/features/auth/actions";
import { INTERVIEW_ACTION_MESSAGES } from "@/core/features/interviews/actionMessages";
import {
  canCreateInterviewAction,
  createInterviewAction,
  generateInterviewFeedbackAction,
  getInterviewByIdAction,
  getInterviewsAction,
  updateInterviewAction,
} from "@/core/features/interviews/actions";
import { checkInterviewPermission } from "@/core/features/interviews/permissions";
import {
  createInterviewService,
  generateInterviewFeedbackService,
  getInterviewByIdService,
  getInterviewsService,
  updateInterviewService,
} from "@/core/features/interviews/service";
import { getJobInfoAction } from "@/core/features/jobInfos/actions";
import { PLAN_LIMIT_MESSAGE, RATE_LIMIT_MESSAGE } from "@/core/lib/errorToast";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeCurrentUser } from "@/core/test-utils/factories/user";
import { makeInterview, makeJobInfo } from "@/core/test-utils/factories";

const mockArcjet = jest.mocked(arcjet);
const mockProtect = jest.mocked(
  mockArcjet.mock.results[0].value.protect as jest.Mock,
);
const mockRequest = jest.mocked(request);
const mockGetCurrentUser = jest.mocked(getCurrentUserAction);
const mockCheckInterviewPermission = jest.mocked(checkInterviewPermission);
const mockGetJobInfoAction = jest.mocked(getJobInfoAction);
const mockCreateInterviewService = jest.mocked(createInterviewService);
const mockUpdateInterviewService = jest.mocked(updateInterviewService);
const mockGetInterviewByIdService = jest.mocked(getInterviewByIdService);
const mockGetInterviewsService = jest.mocked(getInterviewsService);
const mockGenerateInterviewFeedbackService = jest.mocked(
  generateInterviewFeedbackService,
);

const allowDecision = { isDenied: () => false };
const denyDecision = { isDenied: () => true };
const requestContext = { ip: "127.0.0.1" };

describe("interview actions", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    mockGetCurrentUser.mockResolvedValue(
      makeCurrentUser({ userId: TEST_USER_ID }),
    );
    mockCheckInterviewPermission.mockResolvedValue(true);
    mockRequest.mockResolvedValue(requestContext);
    mockProtect.mockResolvedValue(allowDecision);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("createInterviewAction", () => {
    it("returns a login message when the user is unauthenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(makeCurrentUser({ userId: null }));

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.createUnauthorized,
      });

      expect(mockCheckInterviewPermission).not.toHaveBeenCalled();
      expect(mockProtect).not.toHaveBeenCalled();
    });

    it("returns the plan limit message when permission is denied", async () => {
      mockCheckInterviewPermission.mockResolvedValue(false);

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: PLAN_LIMIT_MESSAGE,
      });

      expect(mockProtect).not.toHaveBeenCalled();
      expect(mockGetJobInfoAction).not.toHaveBeenCalled();
      expect(mockCreateInterviewService).not.toHaveBeenCalled();
    });

    it("maps permission check failures to the generic retry message", async () => {
      mockCheckInterviewPermission.mockRejectedValue(new Error("permission"));

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.unexpectedError,
      });

      expect(mockProtect).not.toHaveBeenCalled();
      expect(mockGetJobInfoAction).not.toHaveBeenCalled();
      expect(mockCreateInterviewService).not.toHaveBeenCalled();
    });

    it("returns the rate limit message when Arcjet denies the request", async () => {
      mockProtect.mockResolvedValue(denyDecision);

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: RATE_LIMIT_MESSAGE,
      });

      expect(mockRequest).toHaveBeenCalledWith();
      expect(mockProtect).toHaveBeenCalledWith(requestContext, {
        userId: TEST_USER_ID,
        requested: 1,
      });
      expect(mockGetJobInfoAction).not.toHaveBeenCalled();
      expect(mockCreateInterviewService).not.toHaveBeenCalled();
    });

    it("maps request failures to the generic retry message", async () => {
      mockRequest.mockRejectedValue(new Error("request failed"));

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.unexpectedError,
      });

      expect(mockProtect).not.toHaveBeenCalled();
      expect(mockGetJobInfoAction).not.toHaveBeenCalled();
      expect(mockCreateInterviewService).not.toHaveBeenCalled();
    });

    it("maps Arcjet protection failures to the generic retry message", async () => {
      mockProtect.mockRejectedValue(new Error("arcjet failed"));

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.unexpectedError,
      });

      expect(mockRequest).toHaveBeenCalledWith();
      expect(mockGetJobInfoAction).not.toHaveBeenCalled();
      expect(mockCreateInterviewService).not.toHaveBeenCalled();
    });

    it("returns an access message when the job info is inaccessible", async () => {
      mockGetJobInfoAction.mockResolvedValue(
        null as unknown as Awaited<ReturnType<typeof getJobInfoAction>>,
      );

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.createJobInfoNotFound,
      });

      expect(mockGetJobInfoAction).toHaveBeenCalledWith("job-info-1");
      expect(mockCreateInterviewService).not.toHaveBeenCalled();
    });

    it("returns the created interview id when creation succeeds", async () => {
      const jobInfo = makeJobInfo({ id: "job-info-1" });
      const interview = makeInterview({ jobInfo, jobInfoId: jobInfo.id });
      mockGetJobInfoAction.mockResolvedValue(jobInfo);
      mockCreateInterviewService.mockResolvedValue(interview);

      await expect(
        createInterviewAction({ jobInfoId: jobInfo.id }),
      ).resolves.toEqual({
        success: true,
        data: { id: interview.id },
      });

      expect(mockCreateInterviewService).toHaveBeenCalledWith(jobInfo.id);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("maps unauthorized errors to a login message", async () => {
      mockGetJobInfoAction.mockResolvedValue(makeJobInfo());
      mockCreateInterviewService.mockRejectedValue(new UnauthorizedError());

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.createUnauthorized,
      });
    });

    it("maps database errors to a retry message", async () => {
      mockGetJobInfoAction.mockResolvedValue(makeJobInfo());
      mockCreateInterviewService.mockRejectedValue(
        new DatabaseError("insert failed"),
      );

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.createDatabaseError,
      });
    });

    it("maps unexpected errors to the generic retry message", async () => {
      mockGetJobInfoAction.mockResolvedValue(makeJobInfo());
      mockCreateInterviewService.mockRejectedValue(new Error("boom"));

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.unexpectedError,
      });
    });
  });

  describe("updateInterviewAction", () => {
    const update = { duration: "00:12:34", humeChatId: "chat-test-1" };

    it("returns success when the service succeeds", async () => {
      mockUpdateInterviewService.mockResolvedValue(makeInterview());

      await expect(
        updateInterviewAction("interview-1", update),
      ).resolves.toEqual({
        success: true,
        data: undefined,
      });

      expect(mockUpdateInterviewService).toHaveBeenCalledWith(
        "interview-1",
        update,
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("rejects forged update fields before calling the service", async () => {
      await expect(
        updateInterviewAction("interview-1", {
          duration: "00:12:34",
          jobInfoId: "other-user-job-info",
        }),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.updateInvalidInput,
      });

      expect(mockUpdateInterviewService).not.toHaveBeenCalled();
    });

    it("maps unauthorized errors to a login message", async () => {
      mockUpdateInterviewService.mockRejectedValue(new UnauthorizedError());

      await expect(
        updateInterviewAction("interview-1", update),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.updateUnauthorized,
      });
    });

    it("returns permission error messages from the service", async () => {
      mockUpdateInterviewService.mockRejectedValue(
        new PermissionError("Custom permission message"),
      );

      await expect(
        updateInterviewAction("interview-1", update),
      ).resolves.toEqual({
        success: false,
        message: "Custom permission message",
      });
    });

    it("maps database errors to a retry message", async () => {
      mockUpdateInterviewService.mockRejectedValue(
        new DatabaseError("update failed"),
      );

      await expect(
        updateInterviewAction("interview-1", update),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.updateDatabaseError,
      });
    });

    it("maps unexpected errors to the generic retry message", async () => {
      mockUpdateInterviewService.mockRejectedValue(new Error("boom"));

      await expect(
        updateInterviewAction("interview-1", update),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.unexpectedError,
      });
    });
  });

  describe("generateInterviewFeedbackAction", () => {
    it("returns success when feedback generation succeeds", async () => {
      mockGenerateInterviewFeedbackService.mockResolvedValue("Useful feedback");

      await expect(
        generateInterviewFeedbackAction("interview-1"),
      ).resolves.toEqual({
        success: true,
        data: undefined,
      });

      expect(mockGenerateInterviewFeedbackService).toHaveBeenCalledWith(
        "interview-1",
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("maps unauthorized errors to a login message", async () => {
      mockGenerateInterviewFeedbackService.mockRejectedValue(
        new UnauthorizedError(),
      );

      await expect(
        generateInterviewFeedbackAction("interview-1"),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.feedbackUnauthorized,
      });
    });

    it("returns permission error messages from the service", async () => {
      mockGenerateInterviewFeedbackService.mockRejectedValue(
        new PermissionError("Interview has not been completed yet"),
      );

      await expect(
        generateInterviewFeedbackAction("interview-1"),
      ).resolves.toEqual({
        success: false,
        message: "Interview has not been completed yet",
      });
    });

    it("maps database errors to a retry message", async () => {
      mockGenerateInterviewFeedbackService.mockRejectedValue(
        new DatabaseError("update failed"),
      );

      await expect(
        generateInterviewFeedbackAction("interview-1"),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.feedbackDatabaseError,
      });
    });

    it("maps unexpected errors to the feedback retry message", async () => {
      mockGenerateInterviewFeedbackService.mockRejectedValue(new Error("boom"));

      await expect(
        generateInterviewFeedbackAction("interview-1"),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.feedbackUnexpectedError,
      });
    });
  });

  it("checks interview creation permission through the permission helper", async () => {
    mockCheckInterviewPermission.mockResolvedValue(false);

    await expect(canCreateInterviewAction()).resolves.toBe(false);

    expect(mockCheckInterviewPermission).toHaveBeenCalledWith();
  });

  it("returns false when interview creation permission checks fail", async () => {
    mockCheckInterviewPermission.mockRejectedValue(new Error("permission"));

    await expect(canCreateInterviewAction()).resolves.toBe(false);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error checking interview creation permission:",
      expect.any(Error),
    );
  });

  it("gets one interview by id through the service", async () => {
    const interview = makeInterview();
    mockGetInterviewByIdService.mockResolvedValue(interview);

    await expect(
      getInterviewByIdAction(interview.id, TEST_USER_ID),
    ).resolves.toBe(interview);

    expect(mockGetInterviewByIdService).toHaveBeenCalledWith(
      interview.id,
      TEST_USER_ID,
    );
  });

  it("gets all interviews through the service", async () => {
    const interviews = [makeInterview()];
    mockGetInterviewsService.mockResolvedValue(interviews);

    await expect(getInterviewsAction("job-info-1", TEST_USER_ID)).resolves.toBe(
      interviews,
    );

    expect(mockGetInterviewsService).toHaveBeenCalledWith(
      "job-info-1",
      TEST_USER_ID,
    );
  });
});
