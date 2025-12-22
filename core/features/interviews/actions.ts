"use server";

import { cacheTag, refresh } from "next/cache";
import arcjet, { request, tokenBucket } from "@arcjet/next";

import {
  getInterviewByIdDb,
  getInterviewsDb,
  insertInterviewDb,
  updateInterviewDb,
} from "@/core/features/interviews/db";
import {
  getInterviewIdTag,
  getInterviewJobInfoTag,
} from "@/core/features/interviews/dbCache";
import { checkInterviewPermission } from "@/core/features/interviews/permissions";
import { getJobInfoIdTag } from "@/core/features/jobInfos/dbCache";
import { getJobInfo } from "@/core/features/jobInfos/actions";
import { getCurrentUser } from "@/core/features/auth/server";
import { PLAN_LIMIT_MESSAGE, RATE_LIMIT_MESSAGE } from "@/core/lib/errorToast";
import { env } from "@/core/data/env/server";
import { generateAiInterviewFeedback } from "@/core/services/ai/interviews";
import { dalAssertSuccess, dalDbOperation } from "@/core/dal/helpers";

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

type CreateInterviewReturn = Promise<
  | {
      error: true;
      message: string;
    }
  | {
      error: false;
      id: string;
    }
>;

export async function createInterview({
  jobInfoId,
}: {
  jobInfoId: string;
}): CreateInterviewReturn {
  const { userId } = await getCurrentUser();
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this.",
    };
  }

  const permitted = await checkInterviewPermission();
  if (!permitted) {
    return {
      error: true,
      message: PLAN_LIMIT_MESSAGE,
    };
  }

  const decision = await aj.protect(await request(), {
    userId,
    requested: 1,
  });
  if (decision.isDenied()) {
    return {
      error: true,
      message: RATE_LIMIT_MESSAGE,
    };
  }

  const jobInfo = dalAssertSuccess(await getJobInfo(jobInfoId, userId));
  if (jobInfo == null) {
    return {
      error: true,
      message: "You don't have permission to do this.",
    };
  }

  const interview = dalAssertSuccess(
    await dalDbOperation(
      async () =>
        await insertInterviewDb({
          jobInfoId,
          duration: "00:00:00",
        })
    )
  );

  return {
    error: false,
    id: interview.id,
  };
}

export async function updateInterview(
  id: string,
  interview: { humeChatId?: string; duration?: string }
) {
  const { userId } = await getCurrentUser();
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this.",
    };
  }

  const foundInterview = dalAssertSuccess(
    await dalDbOperation(async () => await getInterviewByIdDb(id))
  );
  if (foundInterview == null)
    return { error: true, message: "You don't have permission to do this." };
  if (foundInterview.jobInfo.userId !== userId)
    return { error: true, message: "You don't have permission to do this." };

  dalAssertSuccess(
    await dalDbOperation(async () => await updateInterviewDb(id, interview))
  );

  return { error: false };
}

export async function getInterviewById(id: string, userId: string) {
  "use cache";
  cacheTag(getInterviewIdTag(id));

  const foundInterview = dalAssertSuccess(
    await dalDbOperation(async () => await getInterviewByIdDb(id))
  );
  if (foundInterview == null) return null;

  cacheTag(getJobInfoIdTag(foundInterview.jobInfo.id));

  if (foundInterview.jobInfo.userId !== userId) return null;
  return foundInterview;
}

export async function canCreateInterview(): Promise<boolean> {
  return await checkInterviewPermission();
}

export async function getInterviews(jobInfoId: string, userId: string) {
  "use cache";
  cacheTag(getInterviewJobInfoTag(jobInfoId));
  cacheTag(getJobInfoIdTag(jobInfoId));

  return dalDbOperation(async () => await getInterviewsDb(jobInfoId, userId));
}

export async function generateInterviewFeedback(interviewId: string) {
  const { userId, user } = await getCurrentUser({
    allData: true,
  });
  if (userId == null || user == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  const interview = await getInterviewById(interviewId, userId);

  if (interview == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  if (interview.humeChatId == null) {
    return {
      error: true,
      message: "Interview has not been completed yet",
    };
  }

  const feedback = dalAssertSuccess(
    await dalDbOperation(
      async () =>
        await generateAiInterviewFeedback({
          humeChatId: interview.humeChatId as string,
          jobInfo: interview.jobInfo,
          userName: user.name,
        })
    )
  );

  if (feedback == null) {
    return {
      error: true,
      message: "Failed to generate feedback",
    };
  }

  dalAssertSuccess(
    await dalDbOperation(
      async () => await updateInterviewDb(interviewId, { feedback })
    )
  );
  refresh();

  return { error: false };
}
