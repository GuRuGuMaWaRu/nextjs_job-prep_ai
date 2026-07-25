import { z } from "zod";
import arcjet, { request, tokenBucket } from "@arcjet/next";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

import { questionDifficulties } from "@/core/drizzle/schema";
import { PLAN_LIMIT_MESSAGE, RATE_LIMIT_MESSAGE } from "@/core/data/constants";
import { generateAiQuestion } from "@/core/services/ai/questions";
import { getCurrentUser } from "@/core/features/auth/helpers";
import { checkQuestionsPermission } from "@/core/features/questions/permissions";
import { getJobInfoAction } from "@/core/features/jobInfos/actions";
import {
  getQuestionsAction,
  insertQuestionAction,
} from "@/core/features/questions/actions";
import {
  DatabaseError,
  NotFoundError,
  PermissionError,
  UnauthorizedError,
  BadRequestError,
  RateLimitError,
} from "@/core/dal/errors";
import { env } from "@/core/data/env/server";

/**
 * Rate Limiting Layer for Generating questions
 */
const aj = arcjet({
  characteristics: ["userId"],
  key: env.ARCJET_KEY,
  rules: [
    tokenBucket({
      capacity: 12,
      refillRate: 4,
      interval: "1d",
      mode: "LIVE",
    }),
  ],
});

const schema = z.object({
  prompt: z.enum(questionDifficulties),
  jobInfoId: z.string().min(1),
});

const JOB_ACCESS_DENIED_MESSAGE = "You do not have permission to do this";

export async function POST(req: Request) {
  try {
    const { user } = await getCurrentUser();

    if (user == null) {
      throw new UnauthorizedError("You are not logged in");
    }

    if (!(await checkQuestionsPermission())) {
      throw new PermissionError(PLAN_LIMIT_MESSAGE);
    }

    const body = await req.json();
    const parseResult = schema.safeParse(body);

    if (!parseResult.success) {
      throw new BadRequestError("Error generating your question");
    }

    const { prompt: difficulty, jobInfoId } = parseResult.data;

    const decision = await aj.protect(await request(), {
      userId: user.id,
      requested: 1,
    });
    if (decision.isDenied()) {
      throw new RateLimitError(RATE_LIMIT_MESSAGE);
    }

    const jobInfo = await getJobInfoAction(jobInfoId);
    if (jobInfo == null) {
      throw new NotFoundError(JOB_ACCESS_DENIED_MESSAGE);
    }

    const previousQuestions = await getQuestionsAction(jobInfoId);

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
              const { id } = await insertQuestionAction(
                question,
                jobInfoId,
                difficulty,
              );
              writer.write({
                type: "text-delta",
                delta: `Question ID: ${id}`,
                id: "generate-question",
              });
            },
            onError: (error) => {
              console.error("Error streaming response", error);
            },
          });

          writer.merge(res.toUIMessageStream());
        },
      }),
    });
  } catch (error) {
    console.error("Error generating question:", error);

    if (error instanceof BadRequestError) {
      return new Response("Error generating your question", { status: 400 });
    }

    if (error instanceof UnauthorizedError) {
      return new Response("You are not logged in", { status: 401 });
    }

    if (error instanceof PermissionError) {
      if (error.message === PLAN_LIMIT_MESSAGE) {
        return new Response(PLAN_LIMIT_MESSAGE, { status: 403 });
      }

      return new Response(JOB_ACCESS_DENIED_MESSAGE, { status: 403 });
    }

    if (error instanceof NotFoundError) {
      return new Response(JOB_ACCESS_DENIED_MESSAGE, { status: 403 });
    }

    if (error instanceof DatabaseError) {
      return new Response("Database error while generating question", {
        status: 500,
      });
    }

    if (error instanceof RateLimitError) {
      return new Response(error.message, { status: 429 });
    }

    return new Response("An error occurred while generating your question", {
      status: 500,
    });
  }
}
