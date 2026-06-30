jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserAction: jest.fn(),
}));

jest.mock("@/core/features/jobInfos/actions", () => ({
  getJobInfoAction: jest.fn(),
}));

jest.mock("@/core/features/resumeAnalysis/permissions", () => ({
  reserveResumeAnalysisUsage: jest.fn(),
}));

jest.mock("@/core/features/resumeAnalysis/schemas", () => {
  const actual = jest.requireActual<
    typeof import("@/core/features/resumeAnalysis/schemas")
  >("@/core/features/resumeAnalysis/schemas");

  return {
    ...actual,
    resumeAnalysisInputSchema: {
      ...actual.resumeAnalysisInputSchema,
      safeParse: jest.fn((input: unknown) =>
        actual.resumeAnalysisInputSchema.safeParse(input),
      ),
    },
  };
});

jest.mock("@/core/services/ai/resumes/ai", () => ({
  analyzeResumeForJob: jest.fn(),
}));

import { z } from "zod";

import { getCurrentUserAction } from "@/core/features/auth/actions";
import { getJobInfoAction } from "@/core/features/jobInfos/actions";
import { reserveResumeAnalysisUsage } from "@/core/features/resumeAnalysis/permissions";
import { resumeAnalysisInputSchema } from "@/core/features/resumeAnalysis/schemas";
import { analyzeResumeForJob } from "@/core/services/ai/resumes/ai";
import {
  DatabaseError,
  NotFoundError,
  PermissionError,
} from "@/core/dal/errors";
import { PLAN_LIMIT_MESSAGE } from "@/core/lib/errorToast";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeCurrentUser, makeJobInfo } from "@/core/test-utils/factories";

import { POST } from "./route";

const mockGetCurrentUserAction = jest.mocked(getCurrentUserAction);
const mockGetJobInfoAction = jest.mocked(getJobInfoAction);
const mockReserveResumeAnalysisUsage = jest.mocked(reserveResumeAnalysisUsage);
const mockAnalyzeResumeForJob = jest.mocked(analyzeResumeForJob);
const mockResumeAnalysisSafeParse = jest.mocked(
  resumeAnalysisInputSchema.safeParse,
);
const actualResumeAnalysisInputSchema = jest.requireActual<
  typeof import("@/core/features/resumeAnalysis/schemas")
>("@/core/features/resumeAnalysis/schemas").resumeAnalysisInputSchema;

const jobInfoId = "00000000-0000-4000-8000-000000000401";

function makeResumeFile(overrides: Partial<FilePropertyBag> = {}): File {
  return new File(["Synthetic resume content"], "resume.txt", {
    type: "text/plain",
    ...overrides,
  });
}

function buildFormRequest({
  resumeFile = makeResumeFile(),
  requestedJobInfoId = jobInfoId,
}: {
  resumeFile?: File | null;
  requestedJobInfoId?: string | null;
} = {}): Request {
  const formData = new FormData();

  if (resumeFile != null) {
    formData.set("resumeFile", resumeFile);
  }

  if (requestedJobInfoId != null) {
    formData.set("jobInfoId", requestedJobInfoId);
  }

  return new Request("http://localhost:3000/api/ai/resumes/analyze", {
    method: "POST",
    body: formData,
  });
}

async function expectTextResponse(
  response: Response,
  status: number,
  body: string,
): Promise<void> {
  expect(response.status).toBe(status);
  await expect(response.text()).resolves.toBe(body);
}

function mockAnalyzeStream(): void {
  mockAnalyzeResumeForJob.mockResolvedValue({
    toTextStreamResponse: jest.fn(
      () =>
        Response.json({
          kind: "resume-analysis-stream",
        }) as ReturnType<
          Awaited<
            ReturnType<typeof analyzeResumeForJob>
          >["toTextStreamResponse"]
        >,
    ),
  } as unknown as Awaited<ReturnType<typeof analyzeResumeForJob>>);
}

describe("POST /api/ai/resumes/analyze", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetCurrentUserAction.mockResolvedValue(
      makeCurrentUser({ userId: TEST_USER_ID }),
    );
    mockGetJobInfoAction.mockResolvedValue(
      makeJobInfo({ id: jobInfoId, userId: TEST_USER_ID }),
    );
    mockReserveResumeAnalysisUsage.mockResolvedValue(true);
    mockResumeAnalysisSafeParse.mockImplementation((input) =>
      actualResumeAnalysisInputSchema.safeParse(input),
    );
    mockAnalyzeStream();

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 when the form data is invalid for resume analysis", async () => {
    const response = await POST(buildFormRequest({ resumeFile: null }));

    await expectTextResponse(response, 400, "Missing resume or job info id");
    expect(mockGetJobInfoAction).not.toHaveBeenCalled();
    expect(mockReserveResumeAnalysisUsage).not.toHaveBeenCalled();
    expect(mockAnalyzeResumeForJob).not.toHaveBeenCalled();
  });

  it("returns the fallback validation message when no issue message is available", async () => {
    mockResumeAnalysisSafeParse.mockReturnValueOnce({
      success: false,
      error: new z.ZodError([]),
    });

    const response = await POST(buildFormRequest());

    await expectTextResponse(response, 400, "Missing resume or job info id");
    expect(mockGetJobInfoAction).not.toHaveBeenCalled();
    expect(mockAnalyzeResumeForJob).not.toHaveBeenCalled();
  });

  it("returns 401 when the current user is unauthenticated", async () => {
    mockGetCurrentUserAction.mockResolvedValueOnce(
      makeCurrentUser({ userId: null }),
    );

    const response = await POST(buildFormRequest());

    await expectTextResponse(response, 401, "You are not logged in");
    expect(mockGetJobInfoAction).not.toHaveBeenCalled();
    expect(mockAnalyzeResumeForJob).not.toHaveBeenCalled();
  });

  it("returns 403 when the job info is inaccessible", async () => {
    mockGetJobInfoAction.mockImplementationOnce(
      async () =>
        null as unknown as Awaited<ReturnType<typeof getJobInfoAction>>,
    );

    const response = await POST(buildFormRequest());

    await expectTextResponse(
      response,
      403,
      "You do not have permission to do this",
    );
    expect(mockReserveResumeAnalysisUsage).not.toHaveBeenCalled();
    expect(mockAnalyzeResumeForJob).not.toHaveBeenCalled();
  });

  it("returns the plan limit response when resume analysis is not allowed", async () => {
    mockReserveResumeAnalysisUsage.mockResolvedValueOnce(false);

    const response = await POST(buildFormRequest());

    await expectTextResponse(response, 403, PLAN_LIMIT_MESSAGE);
    expect(mockAnalyzeResumeForJob).not.toHaveBeenCalled();
  });

  it("returns a streamed success response for resume analysis", async () => {
    const resumeFile = makeResumeFile();
    const jobInfo = makeJobInfo({ id: jobInfoId, userId: TEST_USER_ID });
    mockGetJobInfoAction.mockResolvedValueOnce(jobInfo);

    const response = await POST(buildFormRequest({ resumeFile }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      kind: "resume-analysis-stream",
    });

    expect(mockGetJobInfoAction).toHaveBeenCalledWith(jobInfoId);
    expect(mockReserveResumeAnalysisUsage).toHaveBeenCalledWith(
      TEST_USER_ID,
      jobInfoId,
    );
    expect(mockAnalyzeResumeForJob).toHaveBeenCalledWith({
      resumeFile: expect.objectContaining({
        name: resumeFile.name,
        size: resumeFile.size,
        type: resumeFile.type,
      }),
      jobInfo,
    });
  });

  it("maps not found action failures to a 403 response", async () => {
    mockGetJobInfoAction.mockRejectedValueOnce(
      new NotFoundError("Job info not found"),
    );

    const response = await POST(buildFormRequest());

    await expectTextResponse(
      response,
      403,
      "You do not have permission to do this",
    );
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("maps permission action failures to a 403 response", async () => {
    mockGetJobInfoAction.mockRejectedValueOnce(
      new PermissionError("Job info is not available"),
    );

    const response = await POST(buildFormRequest());

    await expectTextResponse(
      response,
      403,
      "You do not have permission to do this",
    );
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("maps database action failures to a 500 response", async () => {
    mockGetJobInfoAction.mockRejectedValueOnce(
      new DatabaseError("Job info lookup failed"),
    );

    const response = await POST(buildFormRequest());

    await expectTextResponse(
      response,
      500,
      "An error occurred while analyzing your resume",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error analyzing resume:",
      expect.any(DatabaseError),
    );
  });

  it("maps unexpected AI service failures to a 500 response", async () => {
    mockAnalyzeResumeForJob.mockRejectedValueOnce(new Error("Model failed"));

    const response = await POST(buildFormRequest());

    await expectTextResponse(
      response,
      500,
      "An error occurred while analyzing your resume",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error analyzing resume:",
      expect.any(Error),
    );
  });
});
