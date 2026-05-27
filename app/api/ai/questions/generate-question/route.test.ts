jest.mock("ai", () => ({
  createUIMessageStream: jest.fn(({ execute }) => {
    const writer = {
      merge: jest.fn(),
      write: jest.fn(),
    };

    execute({ writer });

    return {
      kind: "ui-message-stream",
      writer,
    };
  }),
  createUIMessageStreamResponse: jest.fn(({ status, statusText, stream }) =>
    Response.json(
      {
        status,
        statusText,
        streamKind: stream.kind,
        writes: stream.writer.write.mock.calls.map(
          ([chunk]: [unknown]) => chunk,
        ),
      },
      { status },
    ),
  ),
}));

jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserAction: jest.fn(),
}));

jest.mock("@/core/features/jobInfos/actions", () => ({
  getJobInfoAction: jest.fn(),
}));

jest.mock("@/core/features/questions/actions", () => ({
  getQuestionsAction: jest.fn(),
  insertQuestionAction: jest.fn(),
}));

jest.mock("@/core/features/questions/permissions", () => ({
  checkQuestionsPermission: jest.fn(),
}));

jest.mock("@/core/services/ai/questions", () => ({
  generateAiQuestion: jest.fn(),
}));

import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

import { getCurrentUserAction } from "@/core/features/auth/actions";
import { getJobInfoAction } from "@/core/features/jobInfos/actions";
import {
  getQuestionsAction,
  insertQuestionAction,
} from "@/core/features/questions/actions";
import { checkQuestionsPermission } from "@/core/features/questions/permissions";
import { generateAiQuestion } from "@/core/services/ai/questions";
import {
  DatabaseError,
  NotFoundError,
  UnauthorizedError,
} from "@/core/dal/errors";
import { PLAN_LIMIT_MESSAGE } from "@/core/lib/errorToast";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import {
  makeCurrentUser,
  makeJobInfo,
  makeQuestion,
} from "@/core/test-utils/factories";

import { POST } from "./route";

const mockCreateUIMessageStream = jest.mocked(createUIMessageStream);
const mockCreateUIMessageStreamResponse = jest.mocked(
  createUIMessageStreamResponse,
);
const mockGetCurrentUserAction = jest.mocked(getCurrentUserAction);
const mockGetJobInfoAction = jest.mocked(getJobInfoAction);
const mockGetQuestionsAction = jest.mocked(getQuestionsAction);
const mockInsertQuestionAction = jest.mocked(insertQuestionAction);
const mockCheckQuestionsPermission = jest.mocked(checkQuestionsPermission);
const mockGenerateAiQuestion = jest.mocked(generateAiQuestion);

const jobInfoId = "00000000-0000-4000-8000-000000000101";

function buildJsonRequest(body: unknown): Request {
  return new Request(
    "http://localhost:3000/api/ai/questions/generate-question",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

async function expectTextResponse(
  response: Response,
  status: number,
  body: string,
): Promise<void> {
  expect(response.status).toBe(status);
  await expect(response.text()).resolves.toBe(body);
}

describe("POST /api/ai/questions/generate-question", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetCurrentUserAction.mockResolvedValue(
      makeCurrentUser({ userId: TEST_USER_ID }),
    );
    mockCheckQuestionsPermission.mockResolvedValue(true);
    mockGetJobInfoAction.mockResolvedValue(
      makeJobInfo({ id: jobInfoId, userId: TEST_USER_ID }),
    );
    mockGetQuestionsAction.mockResolvedValue([
      makeQuestion({
        jobInfoId,
        text: "How would you model tenant-specific billing?",
      }),
    ]);
    mockInsertQuestionAction.mockResolvedValue(
      makeQuestion({
        id: "00000000-0000-4002-8000-000000000202",
        jobInfoId,
        text: "How would you stream a generated response?",
        difficulty: "medium",
      }),
    );
    mockGenerateAiQuestion.mockImplementation(({ onFinish }) => {
      void onFinish("How would you stream a generated response?");

      return {
        toUIMessageStream: jest.fn(() => ({ kind: "model-stream" })),
      } as unknown as ReturnType<typeof generateAiQuestion>;
    });

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 when the JSON body is malformed for question generation", async () => {
    const response = await POST(
      buildJsonRequest({ prompt: "impossible", jobInfoId }),
    );

    await expectTextResponse(response, 400, "Error generating your question");
    expect(mockGetCurrentUserAction).not.toHaveBeenCalled();
    expect(mockGenerateAiQuestion).not.toHaveBeenCalled();
  });

  it("returns 401 when the current user is unauthenticated", async () => {
    mockGetCurrentUserAction.mockResolvedValueOnce(
      makeCurrentUser({ userId: null }),
    );

    const response = await POST(
      buildJsonRequest({ prompt: "medium", jobInfoId }),
    );

    await expectTextResponse(response, 401, "You are not logged in");
    expect(mockCheckQuestionsPermission).not.toHaveBeenCalled();
    expect(mockGenerateAiQuestion).not.toHaveBeenCalled();
  });

  it("returns the plan limit response when question generation is not allowed", async () => {
    mockCheckQuestionsPermission.mockResolvedValueOnce(false);

    const response = await POST(
      buildJsonRequest({ prompt: "medium", jobInfoId }),
    );

    await expectTextResponse(response, 403, PLAN_LIMIT_MESSAGE);
    expect(mockGetJobInfoAction).not.toHaveBeenCalled();
    expect(mockGenerateAiQuestion).not.toHaveBeenCalled();
  });

  it("returns a streamed success response and stores the generated question", async () => {
    const response = await POST(
      buildJsonRequest({ prompt: "medium", jobInfoId }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 200,
      statusText: "OK",
      streamKind: "ui-message-stream",
      writes: [],
    });

    expect(mockGenerateAiQuestion).toHaveBeenCalledWith({
      previousQuestions: expect.arrayContaining([
        expect.objectContaining({
          text: "How would you model tenant-specific billing?",
        }),
      ]),
      jobInfo: expect.objectContaining({ id: jobInfoId }),
      difficulty: "medium",
      onFinish: expect.any(Function),
    });
    expect(mockInsertQuestionAction).toHaveBeenCalledWith(
      "How would you stream a generated response?",
      jobInfoId,
      "medium",
    );
    expect(mockCreateUIMessageStream).toHaveBeenCalledTimes(1);
    expect(mockCreateUIMessageStreamResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 200,
        statusText: "OK",
      }),
    );
  });

  it("maps unauthorized service failures to a 401 response", async () => {
    mockGetJobInfoAction.mockRejectedValueOnce(new UnauthorizedError());

    const response = await POST(
      buildJsonRequest({ prompt: "medium", jobInfoId }),
    );

    await expectTextResponse(response, 401, "You are not logged in");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error generating question:",
      expect.any(UnauthorizedError),
    );
  });

  it("maps missing job info failures to a 403 response", async () => {
    mockGetJobInfoAction.mockRejectedValueOnce(
      new NotFoundError("Job info not found"),
    );

    const response = await POST(
      buildJsonRequest({ prompt: "medium", jobInfoId }),
    );

    await expectTextResponse(
      response,
      403,
      "You do not have permission to do this",
    );
  });

  it("maps database failures to a 500 response", async () => {
    mockGetQuestionsAction.mockRejectedValueOnce(
      new DatabaseError("Question lookup failed"),
    );

    const response = await POST(
      buildJsonRequest({ prompt: "medium", jobInfoId }),
    );

    await expectTextResponse(
      response,
      500,
      "Database error while generating question",
    );
  });
});
