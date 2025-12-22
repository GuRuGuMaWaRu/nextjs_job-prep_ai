import { Suspense } from "react";

import { BackLink } from "@/core/components/BackLink";
import { getJobInfoById } from "@/core/features/jobInfos/actions";
import { routes } from "@/core/data/routes";
import { dalAssertSuccess } from "@/core/dal/helpers";

export function JobInfoBackLink({ jobInfoId }: { jobInfoId: string }) {
  return (
    <BackLink href={routes.jobInfo(jobInfoId)}>
      <Suspense fallback="Back to Job Info Details">
        <JobInfoName jobInfoId={jobInfoId} />
      </Suspense>
    </BackLink>
  );
}

async function JobInfoName({ jobInfoId }: { jobInfoId: string }) {
  const jobInfo = dalAssertSuccess(await getJobInfoById(jobInfoId));

  return jobInfo?.name
    ? `Back to "${jobInfo.name}"`
    : "Back to Job Info Details";
}
