import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import { FullScreenLoader } from "@/core/components/FullScreenLoader";
import { getCurrentUser } from "@/core/services/clerk/lib/getCurrentUser";
import { getJobInfo } from "@/core/features/jobInfos/actions";
import { checkQuestionsPermission } from "@/core/features/questions/permissions";

import { NewQuestionClientPage } from "./_NewQuestionClientPage";
import { JobInfoBackLink } from "@/core/features/jobInfos/components/JobInfoBackLink";

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ jobInfoId: string }>;
}) {
  const { jobInfoId } = await params;

  return (
    <div className="container max-w-5xl my-4 space-y-4">
      <JobInfoBackLink jobInfoId={jobInfoId} />
      <Suspense fallback={<FullScreenLoader />}>
        <SuspendedComponent jobInfoId={jobInfoId} />
      </Suspense>
    </div>
  );
}

async function SuspendedComponent({ jobInfoId }: { jobInfoId: string }) {
  const { userId, redirectToSignIn } = await getCurrentUser();
  if (userId == null) return redirectToSignIn();

  if (!(await checkQuestionsPermission())) redirect("/app/upgrade");

  const jobInfo = await getJobInfo(jobInfoId, userId);
  if (jobInfo == null) return notFound();

  return <NewQuestionClientPage jobInfo={jobInfo} />;
}
