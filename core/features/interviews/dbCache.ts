import { updateTag } from "next/cache";

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

/**
 * Expire interview cache tags immediately after mutations.
 *
 * Uses `updateTag` (not `revalidateTag(..., "max")`) so the post-call redirect
 * to the interview detail page cannot serve a stale row with `humeChatId: null`
 * and hard-404 via SuspendedMessages.
 */
export function revalidateInterviewCache({
  id,
  jobInfoId,
}: {
  id: string;
  jobInfoId: string;
}) {
  updateTag(getInterviewGlobalTag());
  updateTag(getInterviewJobInfoTag(jobInfoId));
  updateTag(getInterviewIdTag(id));
}
