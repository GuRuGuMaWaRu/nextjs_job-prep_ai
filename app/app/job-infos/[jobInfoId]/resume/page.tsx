import { Suspense } from "react";
import { redirect } from "next/navigation";

import { FullScreenLoader } from "@/core/components/FullScreenLoader";
import { JobInfoBackLink } from "@/core/features/jobInfos/components/JobInfoBackLink";
import { checkResumeAnalysisPermission } from "@/core/features/resumeAnalysis/permissions";

import { ResumeAnalysisClientPage } from "./_ResumeAnalysisClientPage";

export default async function ResumePage({
  params,
}: {
  params: Promise<{ jobInfoId: string }>;
}) {
  const { jobInfoId } = await params;

  return (
    <div className="container max-w-5xl py-4 space-y-4 h-screen-header flex flex-col items-start">
      <JobInfoBackLink jobInfoId={jobInfoId} />
      <Suspense fallback={<FullScreenLoader className="m-auto" />}>
        <SuspendedComponent jobInfoId={jobInfoId} />
      </Suspense>
    </div>
  );
}

async function SuspendedComponent({ jobInfoId }: { jobInfoId: string }) {
  if (!(await checkResumeAnalysisPermission())) redirect("/app/upgrade");

  return <ResumeAnalysisClientPage jobInfoId={jobInfoId} />;
}
