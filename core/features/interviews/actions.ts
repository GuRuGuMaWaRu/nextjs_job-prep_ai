"use server";

import { cacheTag } from "next/cache";

import { getCurrentUser } from "@/core/services/clerk/lib/getCurrentUser";
import {
  getInterviewByIdDb,
  insertInterviewDb,
  updateInterviewDb,
} from "@/core/features/interviews/db";
import { getInterviewIdTag } from "@/core/features/interviews/dbCache";
import { getJobInfoIdTag } from "@/core/features/jobInfos/dbCache";
import { getJobInfo } from "@/core/features/jobInfos/actions";

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

  // TODO: Permissions
  // TODO: Rate limit

  const jobInfo = await getJobInfo(jobInfoId, userId);
  if (jobInfo == null) {
    return {
      error: true,
      message: "You don't have permission to do this.",
    };
  }

  const interview = await insertInterviewDb({
    jobInfoId,
    duration: "00:00:00",
  });

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

  const foundInterview = await getInterviewByIdDb(id);
  if (foundInterview == null) {
    return {
      error: true,
      message: "You don't have permission to do this.",
    };
  }

  await updateInterviewDb(id, interview);

  return { error: false };
}

export async function getInterviewById(id: string, userId: string) {
  "use cache";
  cacheTag(getInterviewIdTag(id));

  const foundInterview = await getInterviewByIdDb(id);
  if (foundInterview == null) return null;

  cacheTag(getJobInfoIdTag(foundInterview.jobInfo.id));

  if (foundInterview.jobInfo.userId !== userId) return null;
  return foundInterview;
}
