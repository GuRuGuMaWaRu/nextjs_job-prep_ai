import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import { FullScreenLoader } from "@/core/components/FullScreenLoader";
import { getJobInfo } from "@/core/features/jobInfos/actions";
import { checkQuestionsPermission } from "@/core/features/questions/permissions";
import { JobInfoBackLink } from "@/core/features/jobInfos/components/JobInfoBackLink";
import { getCurrentUser } from "@/core/features/auth/server";
import { routes } from "@/core/data/routes";
import { dalAssertSuccess } from "@/core/dal/helpers";

import { NewQuestionClientPage } from "./_NewQuestionClientPage";

export default async function QuestionsPage({
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
  const { userId, redirectToSignIn } = await getCurrentUser();
  if (userId == null) return redirectToSignIn();

  if (!(await checkQuestionsPermission())) redirect(routes.upgrade);

  const jobInfo = dalAssertSuccess(await getJobInfo(jobInfoId, userId));
  if (jobInfo == null) return notFound();

  return <NewQuestionClientPage jobInfo={jobInfo} />;
}
