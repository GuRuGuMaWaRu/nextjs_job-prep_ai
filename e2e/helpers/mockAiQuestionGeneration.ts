import type { Page } from "@playwright/test";

type MockAiQuestionGenerationOptions = {
  questionText?: string;
  questionId?: string;
};

const defaultQuestionText = "What is a React hook?";
const defaultQuestionId = "00000000-0000-4000-8000-000000009901";

export async function mockAiQuestionGenerationRoute(
  page: Page,
  options: MockAiQuestionGenerationOptions = {},
) {
  const questionText = options.questionText ?? defaultQuestionText;
  const questionId = options.questionId ?? defaultQuestionId;
  const completion = `${questionText}Question ID: ${questionId}`;

  await page.route("**/api/ai/questions/generate-question", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    const chunk = {
      type: "text-delta",
      id: "generate-question",
      delta: completion,
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
