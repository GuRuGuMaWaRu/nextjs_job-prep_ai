import { getGlobalTag, getIdTag, getUserTag } from "@/core/lib/dataCache";
import { revalidateTag } from "next/cache";

export function getJobInfoGlobalTag() {
  return getGlobalTag("jobInfos");
}

export function getJobInfoUserTag(userId: string) {
  return getUserTag(userId, "jobInfos");
}

export function getJobInfoIdTag(id: string) {
  return getIdTag(id, "jobInfos");
}

export function revalidateJobInfoCache({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  revalidateTag(getJobInfoGlobalTag(), "max");
  revalidateTag(getJobInfoUserTag(userId), "max");
  revalidateTag(getJobInfoIdTag(id), "max");
}
