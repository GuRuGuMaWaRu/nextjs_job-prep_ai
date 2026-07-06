import { z } from "zod";
import arcjet, { request, tokenBucket } from "@arcjet/next";

import { RATE_LIMIT_MESSAGE } from "@/core/data/constants";
import { generateAiQuestionFeedback } from "@/core/services/ai/questions";
import { getCurrentUserAction } from "@/core/features/auth/actions";
import { getQuestionByIdAction } from "@/core/features/questions/actions";
import {
  BadRequestError,
  DatabaseError,
  RateLimitError,
  UnauthorizedError,
} from "@/core/dal/errors";
import { env } from "@/core/data/env/server";

/**
 * Rate limiting layer for generating question feedback
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
  prompt: z.string().min(1),
  questionId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const { userId } = await getCurrentUserAction();

    if (userId == null) {
      throw new UnauthorizedError("You are not logged in");
    }

    const body = await req.json();
    const parseResult = schema.safeParse(body);

    if (!parseResult.success) {
      throw new BadRequestError("Error generating feedback");
    }

    const { questionId, prompt: answer } = parseResult.data;

    const decision = await aj.protect(await request(), {
      userId,
      requested: 1,
    });
    if (decision.isDenied()) {
      throw new RateLimitError(RATE_LIMIT_MESSAGE);
    }

    const question = await getQuestionByIdAction(questionId);

    if (question == null) {
      return new Response("Question not found", { status: 404 });
    }

    const res = generateAiQuestionFeedback({
      question: question.text,
      answer,
    });

    return res.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error generating question feedback:", error);

    if (error instanceof BadRequestError) {
      return new Response("Error generating feedback", { status: 400 });
    }

    if (error instanceof UnauthorizedError) {
      return new Response("You are not logged in", { status: 401 });
    }

    if (error instanceof DatabaseError) {
      return new Response("Failed to fetch question from database", {
        status: 500,
      });
    }

    if (error instanceof RateLimitError) {
      return new Response(error.message, { status: 429 });
    }

    return new Response("An error occurred while generating feedback", {
      status: 500,
    });
  }
}
