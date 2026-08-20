import { Suspense } from "react";
import { notFound } from "next/navigation";

import { FullScreenLoader } from "@/core/components/FullScreenLoader";
import { getJobInfoAction } from "@/core/features/jobInfos/actions";
import { canGenerateQuestionsAction } from "@/core/features/questions/actions";
import { JobInfoBackLink } from "@/core/features/jobInfos/components/JobInfoBackLink";

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
  const canGenerateQuestions = await canGenerateQuestionsAction();

  // getJobInfoAction handles auth internally and throws on error
  const jobInfo = await getJobInfoAction(jobInfoId);
  if (jobInfo == null) return notFound();

  return (
    <NewQuestionClientPage
      jobInfo={jobInfo}
      canGenerateQuestions={canGenerateQuestions}
    />
  );
}
