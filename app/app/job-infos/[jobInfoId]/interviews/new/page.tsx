import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { fetchAccessToken } from "hume";
import { Loader2Icon } from "lucide-react";

import { getCurrentUser } from "@/core/services/clerk/lib/getCurrentUser";
import { getJobInfo } from "@/core/features/jobInfos/actions";
import { env } from "@/core/data/env/server";
import { canCreateInterview } from "@/core/features/interviews/actions";

import { StartCall } from "./_StartCall";
import { InterviewVoiceBoundary } from "./_InterviewVoiceBoundary";

export default async function NewInterviewPage({
  params,
}: {
  params: Promise<{ jobInfoId: string }>;
}) {
  const { jobInfoId } = await params;

  return (
    <Suspense
      fallback={
        <div className="h-screen-header flex items-center justify-center">
          <Loader2Icon className="animate-spin size-24" />
        </div>
      }>
      <SuspendedComponent jobInfoId={jobInfoId} />
    </Suspense>
  );
}

async function SuspendedComponent({ jobInfoId }: { jobInfoId: string }) {
  const { userId, redirectToSignIn, user } = await getCurrentUser({
    allData: true,
  });
  if (userId == null || user == null) return redirectToSignIn();

  const hasPermissionForInterviews = await canCreateInterview();
  if (!hasPermissionForInterviews) {
    redirect(`/app/job-infos/${jobInfoId}/interviews`);
  }

  const jobInfo = await getJobInfo(jobInfoId, userId);
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
