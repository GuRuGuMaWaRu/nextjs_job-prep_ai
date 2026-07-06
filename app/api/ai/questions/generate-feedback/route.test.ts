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

jest.mock("@/core/features/questions/permissions", () => ({
  checkQuestionsPermission: jest.fn(),
}));

jest.mock("@/core/features/questions/actions", () => ({
  getQuestionByIdAction: jest.fn(),
}));

jest.mock("@/core/services/ai/questions", () => ({
  generateAiQuestionFeedback: jest.fn(),
}));

import arcjet, { request } from "@arcjet/next";

import { getCurrentUserAction } from "@/core/features/auth/actions";
import { getQuestionByIdAction } from "@/core/features/questions/actions";
import { checkQuestionsPermission } from "@/core/features/questions/permissions";
import { generateAiQuestionFeedback } from "@/core/services/ai/questions";
import { DatabaseError, UnauthorizedError } from "@/core/dal/errors";
import { PLAN_LIMIT_MESSAGE, RATE_LIMIT_MESSAGE } from "@/core/data/constants";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeCurrentUser, makeQuestion } from "@/core/test-utils/factories";

import { POST } from "./route";

const mockArcjet = jest.mocked(arcjet);
const mockProtect = jest.mocked(
  mockArcjet.mock.results[0].value.protect as jest.Mock,
);
const mockRequest = jest.mocked(request);
const mockGetCurrentUserAction = jest.mocked(getCurrentUserAction);
const mockCheckQuestionsPermission = jest.mocked(checkQuestionsPermission);
const mockGetQuestionByIdAction = jest.mocked(getQuestionByIdAction);
const mockGenerateAiQuestionFeedback = jest.mocked(generateAiQuestionFeedback);

const questionId = "00000000-0000-4002-8000-000000000301";
const questionText = "How would you explain server actions in Next.js?";

const allowDecision = { isDenied: () => false };
const denyDecision = { isDenied: () => true };
const requestContext = { ip: "127.0.0.1" };

function buildJsonRequest(body: unknown): Request {
  return new Request(
    "http://localhost:3000/api/ai/questions/generate-feedback",
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

function mockQuestionFound(): void {
  mockGetQuestionByIdAction.mockResolvedValue({
    ...makeQuestion({
      id: questionId,
      text: questionText,
    }),
    jobInfo: {
      id: "00000000-0000-4000-8000-000000000301",
      userId: TEST_USER_ID,
    },
  });
}

function mockFeedbackStream(): void {
  mockGenerateAiQuestionFeedback.mockReturnValue({
    toUIMessageStreamResponse: jest.fn(
      () =>
        Response.json({
          kind: "feedback-stream",
        }) as ReturnType<
          ReturnType<
            typeof generateAiQuestionFeedback
          >["toUIMessageStreamResponse"]
        >,
    ),
  } as unknown as ReturnType<typeof generateAiQuestionFeedback>);
}

describe("POST /api/ai/questions/generate-feedback", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetCurrentUserAction.mockResolvedValue(
      makeCurrentUser({ userId: TEST_USER_ID }),
    );
    mockCheckQuestionsPermission.mockResolvedValue(true);
    mockRequest.mockResolvedValue(requestContext);
    mockProtect.mockResolvedValue(allowDecision);

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 when the JSON body is invalid for feedback generation", async () => {
    const response = await POST(buildJsonRequest({ prompt: "Use caching." }));

    await expectTextResponse(response, 400, "Error generating feedback");
    expect(mockProtect).not.toHaveBeenCalled();
    expect(mockGetQuestionByIdAction).not.toHaveBeenCalled();
    expect(mockGenerateAiQuestionFeedback).not.toHaveBeenCalled();
  });

  it("returns 401 when the current user is unauthenticated", async () => {
    mockGetCurrentUserAction.mockResolvedValueOnce(
      makeCurrentUser({ userId: null }),
    );

    const response = await POST(
      buildJsonRequest({ prompt: "Use caching.", questionId }),
    );

    await expectTextResponse(response, 401, "You are not logged in");
    expect(mockCheckQuestionsPermission).not.toHaveBeenCalled();
    expect(mockProtect).not.toHaveBeenCalled();
    expect(mockGenerateAiQuestionFeedback).not.toHaveBeenCalled();
  });

  it("returns the plan limit response when feedback generation is not allowed", async () => {
    mockCheckQuestionsPermission.mockResolvedValueOnce(false);

    const response = await POST(
      buildJsonRequest({ prompt: "Use caching.", questionId }),
    );

    await expectTextResponse(response, 403, PLAN_LIMIT_MESSAGE);
    expect(mockProtect).not.toHaveBeenCalled();
    expect(mockGetQuestionByIdAction).not.toHaveBeenCalled();
    expect(mockGenerateAiQuestionFeedback).not.toHaveBeenCalled();
  });

  it("returns 429 when Arcjet denies the request", async () => {
    mockProtect.mockResolvedValueOnce(denyDecision);

    const response = await POST(
      buildJsonRequest({ prompt: "Use caching.", questionId }),
    );

    await expectTextResponse(response, 429, RATE_LIMIT_MESSAGE);
    expect(mockRequest).toHaveBeenCalledWith();
    expect(mockProtect).toHaveBeenCalledWith(requestContext, {
      userId: TEST_USER_ID,
      requested: 1,
    });
    expect(mockGetQuestionByIdAction).not.toHaveBeenCalled();
    expect(mockGenerateAiQuestionFeedback).not.toHaveBeenCalled();
  });

  it("returns 404 when the question cannot be found", async () => {
    mockGetQuestionByIdAction.mockResolvedValueOnce(null);

    const response = await POST(
      buildJsonRequest({ prompt: "Use caching.", questionId }),
    );

    await expectTextResponse(response, 404, "Question not found");
    expect(mockGetQuestionByIdAction).toHaveBeenCalledWith(questionId);
    expect(mockGenerateAiQuestionFeedback).not.toHaveBeenCalled();
  });

  it("returns a streamed success response for generated feedback", async () => {
    mockQuestionFound();
    mockFeedbackStream();

    const response = await POST(
      buildJsonRequest({
        prompt: "They can run on the server and mutate data safely.",
        questionId,
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      kind: "feedback-stream",
    });

    expect(mockProtect).toHaveBeenCalledWith(requestContext, {
      userId: TEST_USER_ID,
      requested: 1,
    });
    expect(mockGenerateAiQuestionFeedback).toHaveBeenCalledWith({
      question: questionText,
      answer: "They can run on the server and mutate data safely.",
    });
  });

  it("maps unauthorized action failures to a 401 response", async () => {
    mockGetQuestionByIdAction.mockRejectedValueOnce(new UnauthorizedError());

    const response = await POST(
      buildJsonRequest({ prompt: "Use caching.", questionId }),
    );

    await expectTextResponse(response, 401, "You are not logged in");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error generating question feedback:",
      expect.any(UnauthorizedError),
    );
  });

  it("maps database action failures to a 500 response", async () => {
    mockGetQuestionByIdAction.mockRejectedValueOnce(
      new DatabaseError("Question lookup failed"),
    );

    const response = await POST(
      buildJsonRequest({ prompt: "Use caching.", questionId }),
    );

    await expectTextResponse(
      response,
      500,
      "Failed to fetch question from database",
    );
  });

  it("maps unexpected model failures to a 500 response", async () => {
    mockQuestionFound();
    mockGenerateAiQuestionFeedback.mockImplementationOnce(() => {
      throw new Error("Model unavailable");
    });

    const response = await POST(
      buildJsonRequest({ prompt: "Use caching.", questionId }),
    );

    await expectTextResponse(
      response,
      500,
      "An error occurred while generating feedback",
    );
  });
});
