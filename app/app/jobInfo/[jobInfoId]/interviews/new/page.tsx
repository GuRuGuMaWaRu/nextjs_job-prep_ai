import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { fetchAccessToken } from "hume";

import { FullScreenLoader } from "@/core/components/FullScreenLoader";
import { BackLink } from "@/core/components/BackLink";
import { getCurrentUser } from "@/core/features/auth/server";
import { getJobInfo } from "@/core/features/jobInfos/actions";
import { canCreateInterview } from "@/core/features/interviews/actions";
import { env } from "@/core/data/env/server";
import { routes } from "@/core/data/routes";
import { dalAssertSuccess } from "@/core/dal/helpers";

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
  const { userId, redirectToSignIn, user } = await getCurrentUser({
    allData: true,
  });
  if (userId == null || user == null) return redirectToSignIn();

  const hasPermissionForInterviews = await canCreateInterview();
  if (!hasPermissionForInterviews) {
    redirect(routes.interviews(jobInfoId));
  }

  const jobInfo = dalAssertSuccess(await getJobInfo(jobInfoId, userId));
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
