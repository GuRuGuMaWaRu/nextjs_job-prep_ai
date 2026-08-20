import { revalidateTag } from "next/cache";

import { getGlobalTag, getIdTag, getJobInfoTag } from "@/core/lib/dataCache";

export function getQuestionGlobalTag() {
  return getGlobalTag("questions");
}

export function getQuestionJobInfoTag(jobInfoId: string) {
  return getJobInfoTag("questions", jobInfoId);
}

export function getQuestionIdTag(id: string) {
  return getIdTag("questions", id);
}

export function revalidateQuestionCache({
  id,
  jobInfoId,
}: {
  id: string;
  jobInfoId: string;
}) {
  revalidateTag(getQuestionGlobalTag(), "max");
  revalidateTag(getQuestionJobInfoTag(jobInfoId), "max");
  revalidateTag(getQuestionIdTag(id), "max");
}
