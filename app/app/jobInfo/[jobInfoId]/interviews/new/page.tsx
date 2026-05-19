import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { fetchAccessToken } from "hume";

import { FullScreenLoader } from "@/core/components/FullScreenLoader";
import { BackLink } from "@/core/components/BackLink";
import { getCurrentUserWithProfileAction } from "@/core/features/auth/actions";
import { getJobInfoAction } from "@/core/features/jobInfos/actions";
import { canCreateInterviewAction } from "@/core/features/interviews/actions";
import { env } from "@/core/data/env/server";
import { routes } from "@/core/data/routes";

import { StartCall } from "./_StartCall";
import { InterviewVoiceBoundary } from "./_InterviewVoiceBoundary";

export default async function NewInterviewPage({
  params,
}: {
  params: Promise<{ jobInfoId: string }>;
}) {
  const { jobInfoId } = await params;

  return (
    <div className="container max-w-5xl py-4 space-y-4 h-screen-header flex flex-col items-start">
      <BackLink href={routes.interviews(jobInfoId)} className="self-start">
        Back to Interviews
      </BackLink>

      <Suspense fallback={<FullScreenLoader className="m-auto" />}>
        <SuspendedComponent jobInfoId={jobInfoId} />
      </Suspense>
    </div>
  );
}

async function SuspendedComponent({ jobInfoId }: { jobInfoId: string }) {
  const { redirectToSignIn, user } = await getCurrentUserWithProfileAction();
  if (user == null) return redirectToSignIn();

  const hasPermissionForInterviews = await canCreateInterviewAction();
  if (!hasPermissionForInterviews) {
    redirect(routes.interviews(jobInfoId));
  }

  // getJobInfoAction handles auth internally and throws on error
  const jobInfo = await getJobInfoAction(jobInfoId);
  if (jobInfo == null) return notFound();

  const accessToken = await fetchAccessToken({
    apiKey: env.HUME_API_KEY,
    secretKey: env.HUME_SECRET_KEY,
  });

  return (
    <InterviewVoiceBoundary>
      <StartCall accessToken={accessToken} jobInfo={jobInfo} user={user} />
    </InterviewVoiceBoundary>
  );
}
