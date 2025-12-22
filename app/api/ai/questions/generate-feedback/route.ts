import z from "zod";

import { generateAiQuestionFeedback } from "@/core/services/ai/questions";
import { getCurrentUser } from "@/core/features/auth/server";
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

  const question = await getQuestionById(questionId, userId);

  if (question == null) {
    return new Response("Question not found", { status: 404 });
  }

  const res = generateAiQuestionFeedback({
    question: question.text,
    answer,
  });

  return res.toUIMessageStreamResponse();
}
