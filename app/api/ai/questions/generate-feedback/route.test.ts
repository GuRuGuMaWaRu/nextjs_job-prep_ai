jest.mock("@/core/features/questions/actions", () => ({
  getQuestionByIdAction: jest.fn(),
}));

jest.mock("@/core/services/ai/questions", () => ({
  generateAiQuestionFeedback: jest.fn(),
}));

import { getQuestionByIdAction } from "@/core/features/questions/actions";
import { generateAiQuestionFeedback } from "@/core/services/ai/questions";
import { DatabaseError, UnauthorizedError } from "@/core/dal/errors";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeQuestion } from "@/core/test-utils/factories";

import { POST } from "./route";

const mockGetQuestionByIdAction = jest.mocked(getQuestionByIdAction);
const mockGenerateAiQuestionFeedback = jest.mocked(generateAiQuestionFeedback);

const questionId = "00000000-0000-4002-8000-000000000301";
const questionText = "How would you explain server actions in Next.js?";

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
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 when the JSON body is invalid for feedback generation", async () => {
    const response = await POST(buildJsonRequest({ prompt: "Use caching." }));

    await expectTextResponse(response, 400, "Error generating feedback");
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
