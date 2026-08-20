import arcjet, { request, tokenBucket } from "@arcjet/next";

import { getCurrentUser } from "@/core/lib/getCurrentUser";
import { analyzeResumeForJob } from "@/core/services/ai/resumes/ai";
import { getJobInfoAction } from "@/core/features/jobInfos/actions";
import { reserveResumeAnalysisUsageService } from "@/core/features/resumeAnalysis/service";
import { resumeAnalysisInputSchema } from "@/core/features/resumeAnalysis/schemas";
import { PLAN_LIMIT_MESSAGE, RATE_LIMIT_MESSAGE } from "@/core/data/constants";
import {
  BadRequestError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  UnauthorizedError,
} from "@/core/lib/errors";
import { env } from "@/core/data/env/server";

/**
 * Rate limiting layer for resume analysis
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

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (user == null) {
      throw new UnauthorizedError("You are not logged in");
    }

    const formData = await req.formData();
    const validation = resumeAnalysisInputSchema.safeParse({
      resumeFile: formData.get("resumeFile"),
      jobInfoId: formData.get("jobInfoId"),
    });

    if (!validation.success) {
      const message =
        validation.error.issues[0]?.message ?? "Missing resume or job info id";
      throw new BadRequestError(message);
    }

    const decision = await aj.protect(await request(), {
      userId: user.id,
      requested: 1,
    });
    if (decision.isDenied()) {
      throw new RateLimitError(RATE_LIMIT_MESSAGE);
    }

    const { resumeFile, jobInfoId } = validation.data;

    const jobInfo = await getJobInfoAction(jobInfoId);

    if (jobInfo == null) {
      return new Response("You do not have permission to do this", {
        status: 403,
      });
    }

    if (!(await reserveResumeAnalysisUsageService(jobInfoId))) {
      return new Response(PLAN_LIMIT_MESSAGE, {
        status: 403,
      });
    }

    const res = await analyzeResumeForJob({
      resumeFile,
      jobInfo,
    });

    return res.toTextStreamResponse();
  } catch (error) {
    if (error instanceof BadRequestError) {
      return new Response(error.message, { status: 400 });
    }

    if (error instanceof UnauthorizedError) {
      return new Response("You are not logged in", { status: 401 });
    }

    if (error instanceof NotFoundError || error instanceof PermissionError) {
      return new Response("You do not have permission to do this", {
        status: 403,
      });
    }

    if (error instanceof RateLimitError) {
      return new Response(error.message, { status: 429 });
    }

    console.error("Error analyzing resume:", error);
    return new Response("An error occurred while analyzing your resume", {
      status: 500,
    });
  }
}
