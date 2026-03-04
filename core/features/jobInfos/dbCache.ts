import { revalidateTag } from "next/cache";

import { getGlobalTag, getIdTag, getUserTag } from "@/core/lib/dataCache";
import {
  getInterviewGlobalTag,
  getInterviewJobInfoTag,
} from "@/core/features/interviews/dbCache";
import {
  getQuestionGlobalTag,
  getQuestionJobInfoTag,
} from "@/core/features/questions/dbCache";

export function getJobInfoGlobalTag() {
  return getGlobalTag("jobInfos");
}

export function getJobInfoUserTag(userId: string) {
  return getUserTag("jobInfos", userId);
}

export function getJobInfoIdTag(id: string) {
  return getIdTag("jobInfos", id);
}

export function revalidateJobInfoCache({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  revalidateTag(getJobInfoGlobalTag(), "max");
  revalidateTag(getJobInfoIdTag(id), "max");
  revalidateTag(getJobInfoUserTag(userId), "max");
}

export function revalidateJobInfoAndRelatedItemsCache({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  revalidateTag(getJobInfoGlobalTag(), "max");
  revalidateTag(getJobInfoIdTag(id), "max");
  revalidateTag(getJobInfoUserTag(userId), "max");
  revalidateTag(getInterviewGlobalTag(), "max");
  revalidateTag(getInterviewJobInfoTag(id), "max");
  revalidateTag(getQuestionGlobalTag(), "max");
  revalidateTag(getQuestionJobInfoTag(id), "max");
}
