jest.mock("@/core/features/interviews/service", () => ({
  createInterviewService: jest.fn(),
  generateInterviewFeedbackService: jest.fn(),
  getInterviewByIdService: jest.fn(),
  getInterviewsService: jest.fn(),
  updateInterviewService: jest.fn(),
}));

jest.mock("@/core/features/interviews/permissions", () => ({
  checkInterviewPermission: jest.fn(),
}));

import {
  DatabaseError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  UnauthorizedError,
} from "@/core/lib/errors";
import { INTERVIEW_ERROR_MESSAGES } from "@/core/features/interviews/errorMessages";
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
import { PLAN_LIMIT_MESSAGE, RATE_LIMIT_MESSAGE } from "@/core/data/constants";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeInterview } from "@/core/test-utils/factories";

const mockCheckInterviewPermission = jest.mocked(checkInterviewPermission);
const mockCreateInterviewService = jest.mocked(createInterviewService);
const mockUpdateInterviewService = jest.mocked(updateInterviewService);
const mockGetInterviewByIdService = jest.mocked(getInterviewByIdService);
const mockGetInterviewsService = jest.mocked(getInterviewsService);
const mockGenerateInterviewFeedbackService = jest.mocked(
  generateInterviewFeedbackService,
);

describe("interview actions", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("createInterviewAction", () => {
    it("returns the created interview id when creation succeeds", async () => {
      const interview = makeInterview({ jobInfoId: "job-info-1" });
      mockCreateInterviewService.mockResolvedValue(interview);

      await expect(
        createInterviewAction({ jobInfoId: interview.jobInfoId }),
      ).resolves.toEqual({
        success: true,
        data: { id: interview.id },
      });

      expect(mockCreateInterviewService).toHaveBeenCalledWith(
        interview.jobInfoId,
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("maps unauthorized errors to a login message", async () => {
      mockCreateInterviewService.mockRejectedValue(new UnauthorizedError());

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ERROR_MESSAGES.createUnauthorized,
      });
    });

    it("returns permission error messages from the service", async () => {
      mockCreateInterviewService.mockRejectedValue(
        new PermissionError(PLAN_LIMIT_MESSAGE),
      );

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: PLAN_LIMIT_MESSAGE,
      });
    });

    it("maps rate limit errors to the rate limit token", async () => {
      mockCreateInterviewService.mockRejectedValue(
        new RateLimitError(RATE_LIMIT_MESSAGE),
      );

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: RATE_LIMIT_MESSAGE,
      });
    });

    it("maps not found errors to an access message", async () => {
      mockCreateInterviewService.mockRejectedValue(
        new NotFoundError("missing job info"),
      );

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ERROR_MESSAGES.jobInfoNotFoundOrNoAccess,
      });
    });

    it("maps database errors to a retry message", async () => {
      mockCreateInterviewService.mockRejectedValue(
        new DatabaseError("insert failed"),
      );

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ERROR_MESSAGES.createDatabaseError,
      });
    });

    it("maps unexpected errors to the generic retry message", async () => {
      mockCreateInterviewService.mockRejectedValue(new Error("boom"));

      await expect(
        createInterviewAction({ jobInfoId: "job-info-1" }),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ERROR_MESSAGES.unexpectedError,
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
        message: INTERVIEW_ERROR_MESSAGES.updateInvalidInput,
      });

      expect(mockUpdateInterviewService).not.toHaveBeenCalled();
    });

    it("maps unauthorized errors to a login message", async () => {
      mockUpdateInterviewService.mockRejectedValue(new UnauthorizedError());

      await expect(
        updateInterviewAction("interview-1", update),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ERROR_MESSAGES.updateUnauthorized,
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
        message: INTERVIEW_ERROR_MESSAGES.updateDatabaseError,
      });
    });

    it("maps unexpected errors to the generic retry message", async () => {
      mockUpdateInterviewService.mockRejectedValue(new Error("boom"));

      await expect(
        updateInterviewAction("interview-1", update),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ERROR_MESSAGES.unexpectedError,
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

    it("maps rate limit errors to the rate limit token", async () => {
      mockGenerateInterviewFeedbackService.mockRejectedValue(
        new RateLimitError(RATE_LIMIT_MESSAGE),
      );

      await expect(
        generateInterviewFeedbackAction("interview-1"),
      ).resolves.toEqual({
        success: false,
        message: RATE_LIMIT_MESSAGE,
      });
    });

    it("maps unauthorized errors to a login message", async () => {
      mockGenerateInterviewFeedbackService.mockRejectedValue(
        new UnauthorizedError(),
      );

      await expect(
        generateInterviewFeedbackAction("interview-1"),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ERROR_MESSAGES.feedbackUnauthorized,
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
        message: INTERVIEW_ERROR_MESSAGES.feedbackDatabaseError,
      });
    });

    it("maps unexpected errors to the feedback retry message", async () => {
      mockGenerateInterviewFeedbackService.mockRejectedValue(new Error("boom"));

      await expect(
        generateInterviewFeedbackAction("interview-1"),
      ).resolves.toEqual({
        success: false,
        message: INTERVIEW_ERROR_MESSAGES.feedbackUnexpectedError,
      });
    });
  });

  it("checks interview creation permission through the permission helper", async () => {
    mockCheckInterviewPermission.mockResolvedValue(false);

    await expect(canCreateInterviewAction()).resolves.toBe(false);

    expect(mockCheckInterviewPermission).toHaveBeenCalledWith();
  });

  it("bubbles permission check failures", async () => {
    const error = new Error("permission");
    mockCheckInterviewPermission.mockRejectedValue(error);

    await expect(canCreateInterviewAction()).rejects.toBe(error);
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

    await expect(getInterviewsAction("job-info-1")).resolves.toBe(interviews);

    expect(mockGetInterviewsService).toHaveBeenCalledWith("job-info-1");
  });
});
