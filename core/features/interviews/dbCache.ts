import { getGlobalTag, getIdTag, getJobInfoTag } from "@/core/lib/dataCache";
import { revalidateTag } from "next/cache";

export function getInterviewGlobalTag() {
  return getGlobalTag("interviews");
}

export function getInterviewJobInfoTag(jobInfoId: string) {
  return getJobInfoTag(jobInfoId, "interviews");
}

export function getInterviewIdTag(id: string) {
  return getIdTag(id, "interviews");
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
