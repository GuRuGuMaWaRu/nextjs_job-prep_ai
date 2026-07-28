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

jest.mock("@/core/lib/getCurrentUser", () => ({
  getCurrentUser: jest.fn(),
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

import arcjet, { request } from "@arcjet/next";
import { z } from "zod";

import { getCurrentUser } from "@/core/lib/getCurrentUser";
import { getJobInfoAction } from "@/core/features/jobInfos/actions";
import { reserveResumeAnalysisUsage } from "@/core/features/resumeAnalysis/permissions";
import { resumeAnalysisInputSchema } from "@/core/features/resumeAnalysis/schemas";
import { analyzeResumeForJob } from "@/core/services/ai/resumes/ai";
import {
  DatabaseError,
  NotFoundError,
  PermissionError,
} from "@/core/dal/errors";
import { PLAN_LIMIT_MESSAGE, RATE_LIMIT_MESSAGE } from "@/core/data/constants";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeJobInfo, makeUser } from "@/core/test-utils/factories";

import { POST } from "./route";

const mockArcjet = jest.mocked(arcjet);
const mockProtect = jest.mocked(
  mockArcjet.mock.results[0].value.protect as jest.Mock,
);
const mockRequest = jest.mocked(request);
const mockGetCurrentUser = jest.mocked(getCurrentUser);
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

const allowDecision = { isDenied: () => false };
const denyDecision = { isDenied: () => true };
const requestContext = { ip: "127.0.0.1" };

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

    mockGetCurrentUser.mockResolvedValue(makeUser({ id: TEST_USER_ID }));
    mockGetJobInfoAction.mockResolvedValue(
      makeJobInfo({ id: jobInfoId, userId: TEST_USER_ID }),
    );
    mockReserveResumeAnalysisUsage.mockResolvedValue(true);
    mockRequest.mockResolvedValue(requestContext);
    mockProtect.mockResolvedValue(allowDecision);
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
    expect(mockProtect).not.toHaveBeenCalled();
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
    mockGetCurrentUser.mockResolvedValue(null);

    const response = await POST(buildFormRequest());

    await expectTextResponse(response, 401, "You are not logged in");
    expect(mockProtect).not.toHaveBeenCalled();
    expect(mockGetJobInfoAction).not.toHaveBeenCalled();
    expect(mockAnalyzeResumeForJob).not.toHaveBeenCalled();
  });

  it("returns 429 when Arcjet denies the request", async () => {
    mockProtect.mockResolvedValueOnce(denyDecision);

    const response = await POST(buildFormRequest());

    await expectTextResponse(response, 429, RATE_LIMIT_MESSAGE);
    expect(mockRequest).toHaveBeenCalledWith();
    expect(mockProtect).toHaveBeenCalledWith(requestContext, {
      userId: TEST_USER_ID,
      requested: 1,
    });
    expect(mockGetJobInfoAction).not.toHaveBeenCalled();
    expect(mockReserveResumeAnalysisUsage).not.toHaveBeenCalled();
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

  it("maps reservation failures to a 500 response", async () => {
    mockReserveResumeAnalysisUsage.mockRejectedValueOnce(
      new DatabaseError("Reservation insert failed"),
    );

    const response = await POST(buildFormRequest());

    await expectTextResponse(
      response,
      500,
      "An error occurred while analyzing your resume",
    );
    expect(mockAnalyzeResumeForJob).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error analyzing resume:",
      expect.any(DatabaseError),
    );
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

    expect(mockProtect).toHaveBeenCalledWith(requestContext, {
      userId: TEST_USER_ID,
      requested: 1,
    });
    expect(mockGetJobInfoAction).toHaveBeenCalledWith(jobInfoId);
    expect(mockReserveResumeAnalysisUsage).toHaveBeenCalledWith(
      TEST_USER_ID,
      "free",
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
