import { Suspense } from "react";
import { Loader2Icon } from "lucide-react";
import { getCurrentUser } from "@/core/services/clerk/lib/getCurrentUser";
import { notFound } from "next/navigation";
import { getJobInfo } from "@/core/features/jobInfos/actions";
import { fetchAccessToken } from "hume";
import { VoiceProvider } from "@humeai/voice-react";
import { env } from "@/core/data/env/server";
import { StartCall } from "./_StartCall";

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

  const jobInfo = await getJobInfo(jobInfoId, userId);
  if (jobInfo == null) return notFound();

  const accessToken = await fetchAccessToken({
    apiKey: env.HUME_API_KEY,
    secretKey: env.HUME_SECRET_KEY,
  });

  return (
    <VoiceProvider>
      <StartCall accessToken={accessToken} jobInfo={jobInfo} user={user} />
    </VoiceProvider>
  );
}
