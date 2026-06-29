import { expect, type Page } from "@playwright/test";

type MockAiAnswerFeedbackGenerationOptions = {
  expectedPrompt: string;
  expectedQuestionId: string;
  feedbackText?: string;
};

const defaultFeedbackText = "Good job!";

export async function mockAiAnswerFeedbackGenerationRoute(
  page: Page,
  options: MockAiAnswerFeedbackGenerationOptions,
) {
  const feedbackText = options.feedbackText ?? defaultFeedbackText;

  await page.route("**/api/ai/questions/generate-feedback", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    const requestBody: unknown = route.request().postDataJSON();

    expect(requestBody).toMatchObject({
      prompt: options.expectedPrompt,
      questionId: options.expectedQuestionId,
    });

    const chunk = {
      type: "text-delta",
      id: "generate-feedback",
      delta: feedbackText,
    };

    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      headers: {
        "cache-control": "no-cache",
        "x-vercel-ai-ui-message-stream": "v1",
      },
      body: `data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`,
    });
  });
}
