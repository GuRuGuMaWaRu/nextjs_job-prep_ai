jest.mock("next/cache", () => {
  const { createNextCacheMock } = jest.requireActual<
    typeof import("@core/test-utils/mocks/next")
  >("@core/test-utils/mocks/next");

  return createNextCacheMock();
});

jest.mock("@/core/features/jobInfos/service", () => ({
  createJobInfoService: jest.fn(),
  getJobInfoByIdService: jest.fn(),
  getJobInfoService: jest.fn(),
  getJobInfosService: jest.fn(),
  removeJobInfoService: jest.fn(),
  updateJobInfoService: jest.fn(),
}));

jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserAction: jest.fn(),
  getCurrentUserWithProfileAction: jest.fn(),
}));

import { revalidatePath } from "next/cache";

import { routes } from "@/core/data/routes";
import {
  DatabaseError,
  NotFoundError,
  PermissionError,
  UnauthorizedError,
} from "@/core/dal/errors";
import {
  createJobInfoAction,
  getJobInfoAction,
  getJobInfoByIdAction,
  getJobInfosAction,
  removeJobInfoAction,
  updateJobInfoAction,
} from "@/core/features/jobInfos/actions";
import { JOB_INFO_ACTION_MESSAGES } from "@/core/features/jobInfos/actionMessages";
import {
  createJobInfoService,
  getJobInfoByIdService,
  getJobInfoService,
  getJobInfosService,
  removeJobInfoService,
  updateJobInfoService,
} from "@/core/features/jobInfos/service";
import { makeJobInfo } from "@/core/test-utils/factories";

const mockCreateJobInfoService = jest.mocked(createJobInfoService);
const mockGetJobInfoByIdService = jest.mocked(getJobInfoByIdService);
const mockGetJobInfoService = jest.mocked(getJobInfoService);
const mockGetJobInfosService = jest.mocked(getJobInfosService);
const mockRemoveJobInfoService = jest.mocked(removeJobInfoService);
const mockUpdateJobInfoService = jest.mocked(updateJobInfoService);
const mockRevalidatePath = jest.mocked(revalidatePath);

const validJobInfoInput = {
  name: "Example Co",
  title: "Frontend Engineer",
  experienceLevel: "mid-level" as const,
  description: "Build polished user-facing workflows.",
};

describe("job info actions", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("createJobInfoAction", () => {
    it("returns a validation message when the input is invalid", async () => {
      await expect(
        createJobInfoAction({ ...validJobInfoInput, name: "" }),
      ).resolves.toEqual({
        success: false,
        message: JOB_INFO_ACTION_MESSAGES.invalidInput,
      });

      expect(mockCreateJobInfoService).not.toHaveBeenCalled();
    });

    it("returns the created job info id when the service succeeds", async () => {
      const jobInfo = makeJobInfo(validJobInfoInput);
      mockCreateJobInfoService.mockResolvedValue(jobInfo);

      await expect(createJobInfoAction(validJobInfoInput)).resolves.toEqual({
        success: true,
        data: { id: jobInfo.id },
      });

      expect(mockCreateJobInfoService).toHaveBeenCalledWith(validJobInfoInput);
      expect(mockRevalidatePath).toHaveBeenCalledWith(routes.app);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("maps unauthorized errors to a login message", async () => {
      mockCreateJobInfoService.mockRejectedValue(new UnauthorizedError());

      await expect(createJobInfoAction(validJobInfoInput)).resolves.toEqual({
        success: false,
        message: JOB_INFO_ACTION_MESSAGES.createUnauthorized,
      });
    });

    it("maps database errors to a retry message", async () => {
      mockCreateJobInfoService.mockRejectedValue(
        new DatabaseError("insert failed"),
      );

      await expect(createJobInfoAction(validJobInfoInput)).resolves.toEqual({
        success: false,
        message: JOB_INFO_ACTION_MESSAGES.createDatabaseError,
      });
    });

    it("maps unexpected errors to the generic retry message", async () => {
      mockCreateJobInfoService.mockRejectedValue(new Error("boom"));

      await expect(createJobInfoAction(validJobInfoInput)).resolves.toEqual({
        success: false,
        message: JOB_INFO_ACTION_MESSAGES.unexpectedError,
      });
    });
  });

  describe("updateJobInfoAction", () => {
    it("returns a validation message when the input is invalid", async () => {
      await expect(updateJobInfoAction("job-info-id", null)).resolves.toEqual({
        success: false,
        message: JOB_INFO_ACTION_MESSAGES.invalidInput,
      });

      expect(mockUpdateJobInfoService).not.toHaveBeenCalled();
    });

    it("returns the updated job info id when the service succeeds", async () => {
      const jobInfo = makeJobInfo(validJobInfoInput);
      mockUpdateJobInfoService.mockResolvedValue(jobInfo);

      await expect(
        updateJobInfoAction(jobInfo.id, validJobInfoInput),
      ).resolves.toEqual({
        success: true,
        data: { id: jobInfo.id },
      });

      expect(mockUpdateJobInfoService).toHaveBeenCalledWith(
        jobInfo.id,
        validJobInfoInput,
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("maps unauthorized errors to a login message", async () => {
      mockUpdateJobInfoService.mockRejectedValue(new UnauthorizedError());

      await expect(
        updateJobInfoAction("job-info-id", validJobInfoInput),
      ).resolves.toEqual({
        success: false,
        message: JOB_INFO_ACTION_MESSAGES.updateUnauthorized,
      });
    });

    it("maps not found errors to an access message", async () => {
      mockUpdateJobInfoService.mockRejectedValue(
        new NotFoundError("not found"),
      );

      await expect(
        updateJobInfoAction("job-info-id", validJobInfoInput),
      ).resolves.toEqual({
        success: false,
        message: JOB_INFO_ACTION_MESSAGES.updateNotFound,
      });
    });

    it("returns permission error messages from the service", async () => {
      mockUpdateJobInfoService.mockRejectedValue(
        new PermissionError("Custom permission message"),
      );

      await expect(
        updateJobInfoAction("job-info-id", validJobInfoInput),
      ).resolves.toEqual({
        success: false,
        message: "Custom permission message",
      });
    });

    it("maps database errors to a retry message", async () => {
      mockUpdateJobInfoService.mockRejectedValue(
        new DatabaseError("update failed"),
      );

      await expect(
        updateJobInfoAction("job-info-id", validJobInfoInput),
      ).resolves.toEqual({
        success: false,
        message: JOB_INFO_ACTION_MESSAGES.updateDatabaseError,
      });
    });

    it("maps unexpected errors to the generic retry message", async () => {
      mockUpdateJobInfoService.mockRejectedValue(new Error("boom"));

      await expect(
        updateJobInfoAction("job-info-id", validJobInfoInput),
      ).resolves.toEqual({
        success: false,
        message: JOB_INFO_ACTION_MESSAGES.unexpectedError,
      });
    });
  });

  it("gets one job info through the service", async () => {
    const jobInfo = makeJobInfo();
    mockGetJobInfoService.mockResolvedValue(jobInfo);

    await expect(getJobInfoAction(jobInfo.id)).resolves.toBe(jobInfo);

    expect(mockGetJobInfoService).toHaveBeenCalledWith(jobInfo.id);
  });

  it("gets one job info by id through the service", async () => {
    const jobInfo = makeJobInfo();
    mockGetJobInfoByIdService.mockResolvedValue(jobInfo);

    await expect(getJobInfoByIdAction(jobInfo.id)).resolves.toBe(jobInfo);

    expect(mockGetJobInfoByIdService).toHaveBeenCalledWith(jobInfo.id);
  });

  it("gets all job infos through the service", async () => {
    const jobInfos = [makeJobInfo()];
    mockGetJobInfosService.mockResolvedValue(jobInfos);

    await expect(getJobInfosAction()).resolves.toBe(jobInfos);

    expect(mockGetJobInfosService).toHaveBeenCalledWith();
  });

  it("removes a job info through the service", async () => {
    const jobInfo = makeJobInfo();
    const result = { success: true as const, data: jobInfo };
    mockRemoveJobInfoService.mockResolvedValue(result);

    await expect(removeJobInfoAction(jobInfo.id)).resolves.toBe(result);

    expect(mockRemoveJobInfoService).toHaveBeenCalledWith(jobInfo.id);
    expect(mockRevalidatePath).toHaveBeenCalledWith(routes.app);
  });

  it("does not revalidate when removeJobInfoService returns failure", async () => {
    const result = {
      success: false as const,
      message: "Failed to remove job information from database",
    };
    mockRemoveJobInfoService.mockResolvedValue(result);

    await expect(removeJobInfoAction("job-info-id")).resolves.toBe(result);

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("maps unauthorized remove errors to a login message", async () => {
    mockRemoveJobInfoService.mockRejectedValue(new UnauthorizedError());

    await expect(removeJobInfoAction("job-info-id")).resolves.toEqual({
      success: false,
      message: JOB_INFO_ACTION_MESSAGES.removeUnauthorized,
    });

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("maps not-found remove errors to a user-facing message", async () => {
    mockRemoveJobInfoService.mockRejectedValue(new NotFoundError("missing"));

    await expect(removeJobInfoAction("job-info-id")).resolves.toEqual({
      success: false,
      message: JOB_INFO_ACTION_MESSAGES.removeNotFound,
    });

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
