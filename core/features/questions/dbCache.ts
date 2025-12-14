import { revalidateTag } from "next/cache";

import { getGlobalTag, getIdTag, getJobInfoTag } from "@/core/lib/dataCache";

export function getQuestionGlobalTag() {
  return getGlobalTag("questions");
}

export function getQuestionJobInfoTag(jobInfoId: string) {
  return getJobInfoTag(jobInfoId, "questions");
}

export function getQuestionIdTag(id: string) {
  return getIdTag(id, "questions");
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
