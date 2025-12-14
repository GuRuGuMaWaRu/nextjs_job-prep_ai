import z from "zod";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

import { PLAN_LIMIT_MESSAGE } from "@/core/lib/errorToast";
import { generateAiQuestionFeedback } from "@/core/services/ai/questions";
import { getCurrentUser } from "@/core/services/clerk/lib/getCurrentUser";
import { checkQuestionsPermission } from "@/core/features/questions/permissions";
import { getQuestionById } from "@/core/features/questions/actions";

const schema = z.object({
  prompt: z.string().min(1),
  questionId: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return new Response("Error generating feedback", { status: 400 });
  }

  const { questionId, prompt: answer } = result.data;
  const { userId } = await getCurrentUser();

  if (userId == null) {
    return new Response("You are not logged in", { status: 401 });
  }

  if (!(await checkQuestionsPermission())) {
    return new Response(PLAN_LIMIT_MESSAGE, { status: 403 });
  }

  const question = await getQuestionById(questionId);

  if (question == null) {
    return new Response("Question not found", { status: 404 });
  }

  return createUIMessageStreamResponse({
    status: 200,
    statusText: "OK",
    stream: createUIMessageStream({
      execute({ writer }) {
        const res = generateAiQuestionFeedback({
          question: question.text,
          answer,
        });

        writer.merge(res.toUIMessageStream());
      },
    }),
  });
}
