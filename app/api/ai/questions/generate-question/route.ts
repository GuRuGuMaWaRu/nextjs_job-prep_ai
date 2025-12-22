import z from "zod";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

import { questionDifficulties } from "@/core/drizzle/schema";
import { PLAN_LIMIT_MESSAGE } from "@/core/lib/errorToast";
import { generateAiQuestion } from "@/core/services/ai/questions";
import { getCurrentUser } from "@/core/features/auth/server";
import { checkQuestionsPermission } from "@/core/features/questions/permissions";
import { getJobInfo } from "@/core/features/jobInfos/actions";
import {
  getQuestions,
  insertQuestion,
} from "@/core/features/questions/actions";

const schema = z.object({
  prompt: z.enum(questionDifficulties),
  jobInfoId: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return new Response("Error generating your question", { status: 400 });
  }

  const { prompt: difficulty, jobInfoId } = result.data;
  const { userId } = await getCurrentUser();

  if (userId == null) {
    return new Response("You are not logged in", { status: 401 });
  }

  if (!(await checkQuestionsPermission())) {
    return new Response(PLAN_LIMIT_MESSAGE, { status: 403 });
  }

  const jobInfo = await getJobInfo(jobInfoId, userId);
  if (jobInfo == null) {
    return new Response("You do not have permission to do this", {
      status: 403,
    });
  }

  const previousQuestions = await getQuestions(jobInfoId);

  return createUIMessageStreamResponse({
    status: 200,
    statusText: "OK",
    stream: createUIMessageStream({
      execute({ writer }) {
        const res = generateAiQuestion({
          previousQuestions,
          jobInfo,
          difficulty,
          onFinish: async (question) => {
            const { id } = await insertQuestion(
              question,
              jobInfoId,
              difficulty
            );
            writer.write({
              type: "text-delta",
              delta: `Question ID: ${id}`,
              id: "generate-question",
            });
          },
        });

        writer.merge(res.toUIMessageStream());
      },
    }),
  });
}
