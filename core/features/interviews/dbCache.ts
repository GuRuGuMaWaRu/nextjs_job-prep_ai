import { revalidateTag } from "next/cache";

import { getGlobalTag, getIdTag, getJobInfoTag } from "@/core/lib/dataCache";

export function getInterviewGlobalTag() {
  return getGlobalTag("interviews");
}

export function getInterviewJobInfoTag(jobInfoId: string) {
  return getJobInfoTag("interviews", jobInfoId);
}

export function getInterviewIdTag(id: string) {
  return getIdTag("interviews", id);
}

export function revalidateInterviewCache({
  id,
  jobInfoId,
}: {
  id: string;
  jobInfoId: string;
}) {
  revalidateTag(getInterviewGlobalTag(), "max");
  revalidateTag(getInterviewJobInfoTag(jobInfoId), "max");
  revalidateTag(getInterviewIdTag(id), "max");
}
