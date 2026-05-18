import type { QuestionTable } from "@/core/drizzle/schema";
import { TEST_FIXTURE_NOW_ISO } from "@/core/test-utils/constants";

let questionCounter = 0;

function nextQuestionIndex(): number {
  questionCounter += 1;
  return questionCounter;
}

export function makeQuestion(
  overrides: Partial<typeof QuestionTable.$inferSelect> = {},
): typeof QuestionTable.$inferSelect {
  const index = nextQuestionIndex();
  const now = new Date(TEST_FIXTURE_NOW_ISO);

  return {
    id: `00000000-0000-4002-8000-${String(index).padStart(12, "0")}`,
    jobInfoId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    text: `Question ${index}`,
    difficulty: "medium",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
