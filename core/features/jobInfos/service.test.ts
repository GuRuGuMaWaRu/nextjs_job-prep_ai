jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/core/features/jobInfos/dal", () => ({
  createJobInfoDal: jest.fn(),
  getJobInfoDal: jest.fn(),
  getJobInfoByIdDal: jest.fn(),
  getJobInfosDal: jest.fn(),
  removeJobInfoDal: jest.fn(),
  updateJobInfoDal: jest.fn(),
}));

import { NotFoundError, PermissionError } from "@/core/dal/helpers";
import { getCurrentUser } from "@/core/features/auth/actions";
import {
  createJobInfoDal,
  getJobInfoByIdDal,
  getJobInfoDal,
  getJobInfosDal,
  removeJobInfoDal,
  updateJobInfoDal,
} from "@/core/features/jobInfos/dal";
import {
  createJobInfoService,
  getJobInfoByIdService,
  getJobInfoService,
  getJobInfosService,
  removeJobInfoService,
  updateJobInfoService,
  verifyJobInfoAccessService,
} from "@/core/features/jobInfos/service";
import {
  TEST_OTHER_USER_ID,
  TEST_USER_ID,
} from "@/core/test-utils/constants";
import { makeJobInfo } from "@/core/test-utils/factories";
import { makeCurrentUser } from "@/core/test-utils/factories/user";

const mockGetCurrentUser = jest.mocked(getCurrentUser);
const mockCreateJobInfoDal = jest.mocked(createJobInfoDal);
const mockGetJobInfoDal = jest.mocked(getJobInfoDal);
const mockGetJobInfoByIdDal = jest.mocked(getJobInfoByIdDal);
const mockGetJobInfosDal = jest.mocked(getJobInfosDal);
const mockRemoveJobInfoDal = jest.mocked(removeJobInfoDal);
const mockUpdateJobInfoDal = jest.mocked(updateJobInfoDal);

const jobInfoInput = {
  name: "Example Co",
  title: "Frontend Engineer",
  experienceLevel: "mid-level" as const,
  description: "Build thoughtful product interfaces.",
};

const SIGNED_IN_USER_ID = TEST_USER_ID;
const OTHER_USER_ID = TEST_OTHER_USER_ID;

describe("job info service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(
      makeCurrentUser({ userId: SIGNED_IN_USER_ID }),
    );
  });

  it("creates a job info for the signed-in user", async () => {
    const jobInfo = makeJobInfo({ ...jobInfoInput, userId: SIGNED_IN_USER_ID });
    mockCreateJobInfoDal.mockResolvedValue(jobInfo);

    await expect(createJobInfoService(jobInfoInput)).resolves.toBe(jobInfo);

    expect(mockCreateJobInfoDal).toHaveBeenCalledWith({
      ...jobInfoInput,
      userId: SIGNED_IN_USER_ID,
    });
  });

  it("updates a job info when the signed-in user owns it", async () => {
    const existingJobInfo = makeJobInfo({ userId: SIGNED_IN_USER_ID });
    const updatedJobInfo = { ...existingJobInfo, ...jobInfoInput };
    mockGetJobInfoDal.mockResolvedValue(existingJobInfo);
    mockUpdateJobInfoDal.mockResolvedValue(updatedJobInfo);

    await expect(
      updateJobInfoService(existingJobInfo.id, jobInfoInput),
    ).resolves.toBe(updatedJobInfo);

    expect(mockGetJobInfoDal).toHaveBeenCalledWith(
      existingJobInfo.id,
      SIGNED_IN_USER_ID,
    );
    expect(mockUpdateJobInfoDal).toHaveBeenCalledWith(
      existingJobInfo.id,
      jobInfoInput,
    );
  });

  it("rejects updates when the job info cannot be found for the user", async () => {
    mockGetJobInfoDal.mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof getJobInfoDal>>,
    );

    await expect(
      updateJobInfoService("job-info-1", jobInfoInput),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(mockUpdateJobInfoDal).not.toHaveBeenCalled();
  });

  it("rejects updates when ownership does not match the signed-in user", async () => {
    const existingJobInfo = makeJobInfo({ userId: OTHER_USER_ID });
    mockGetJobInfoDal.mockResolvedValue(existingJobInfo);

    await expect(
      updateJobInfoService(existingJobInfo.id, jobInfoInput),
    ).rejects.toBeInstanceOf(PermissionError);

    expect(mockUpdateJobInfoDal).not.toHaveBeenCalled();
  });

  it("gets one job info through the ownership-aware DAL", async () => {
    const jobInfo = makeJobInfo({ userId: SIGNED_IN_USER_ID });
    mockGetJobInfoDal.mockResolvedValue(jobInfo);

    await expect(getJobInfoService(jobInfo.id)).resolves.toBe(jobInfo);

    expect(mockGetJobInfoDal).toHaveBeenCalledWith(
      jobInfo.id,
      SIGNED_IN_USER_ID,
    );
  });

  it("gets one job info by id without requiring authentication", async () => {
    const jobInfo = makeJobInfo();
    mockGetJobInfoByIdDal.mockResolvedValue(jobInfo);

    await expect(getJobInfoByIdService(jobInfo.id)).resolves.toBe(jobInfo);

    expect(mockGetCurrentUser).not.toHaveBeenCalled();
    expect(mockGetJobInfoByIdDal).toHaveBeenCalledWith(jobInfo.id);
  });

  it("gets all job infos for the signed-in user", async () => {
    const jobInfos = [makeJobInfo({ userId: SIGNED_IN_USER_ID })];
    mockGetJobInfosDal.mockResolvedValue(jobInfos);

    await expect(getJobInfosService()).resolves.toBe(jobInfos);

    expect(mockGetJobInfosDal).toHaveBeenCalledWith(SIGNED_IN_USER_ID);
  });

  it("returns job info and user id when access is verified", async () => {
    const jobInfo = makeJobInfo({ userId: SIGNED_IN_USER_ID });
    mockGetJobInfoDal.mockResolvedValue(jobInfo);

    await expect(verifyJobInfoAccessService(jobInfo.id)).resolves.toEqual({
      jobInfo,
      userId: SIGNED_IN_USER_ID,
    });
  });

  it("rejects access verification when no accessible job info exists", async () => {
    mockGetJobInfoDal.mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof getJobInfoDal>>,
    );

    await expect(
      verifyJobInfoAccessService("job-info-1"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("removes a job info after confirming user access", async () => {
    const jobInfo = makeJobInfo({ userId: SIGNED_IN_USER_ID });
    const result = { success: true as const, data: jobInfo };
    mockGetJobInfoDal.mockResolvedValue(jobInfo);
    mockRemoveJobInfoDal.mockResolvedValue(result);

    await expect(removeJobInfoService(jobInfo.id)).resolves.toBe(result);

    expect(mockRemoveJobInfoDal).toHaveBeenCalledWith(jobInfo.id);
  });

  it("does not remove job info when it is not accessible", async () => {
    mockGetJobInfoDal.mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof getJobInfoDal>>,
    );

    await expect(removeJobInfoService("job-info-1")).rejects.toBeInstanceOf(
      NotFoundError,
    );

    expect(mockRemoveJobInfoDal).not.toHaveBeenCalled();
  });
});
