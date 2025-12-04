import { Suspense } from "react";

import { BackLink } from "@/core/components/BackLink";
import { getJobInfoById } from "@/core/features/jobInfos/actions";

export default function JobInfoBackLink({ jobInfoId }: { jobInfoId: string }) {
  return (
    <BackLink href={`/app/job-infos/${jobInfoId}`}>
      <Suspense fallback="Back to Job Info Details">
        <JobInfoName jobInfoId={jobInfoId} />
      </Suspense>
    </BackLink>
  );
}

async function JobInfoName({ jobInfoId }: { jobInfoId: string }) {
  const jobInfo = await getJobInfoById(jobInfoId);

  return jobInfo?.name
    ? `Back to "${jobInfo.name}"`
    : "Back to Job Info Details";
}
