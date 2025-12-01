import { Suspense } from "react";
import { cacheTag } from "next/cache";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { Loader2Icon } from "lucide-react";

import { db } from "@/core/drizzle/db";
import { InterviewTable } from "@/core/drizzle/schema";
import { Card, CardContent } from "@/core/components/ui/card";
import { getInterviewJobInfoTag } from "@/core/features/interviews/dbCache";
import { getJobInfoIdTag } from "@/core/features/jobInfos/dbCache";
import JobInfoBackLink from "@/core/features/jobInfos/components/JobInfoBackLink";
import { getCurrentUser } from "@/core/services/clerk/lib/getCurrentUser";
import { redirect } from "next/navigation";

export default async function InterviewsPage({
  params,
}: {
  params: Promise<{ jobInfoId: string }>;
}) {
  const { jobInfoId } = await params;

  return (
    <div className="container py-4 h-screen-header flex flex-col gap-4 items-start">
      <JobInfoBackLink jobInfoId={jobInfoId} />

      <Suspense
        fallback={<Loader2Icon className="animate-spin size-24 m-auto" />}>
        <SuspendedPage jobInfoId={jobInfoId} />
      </Suspense>
    </div>
  );
}

async function SuspendedPage({ jobInfoId }: { jobInfoId: string }) {
  const { userId, redirectToSignIn } = await getCurrentUser();
  if (userId == null) return redirectToSignIn();

  const interviews = await getInterviews(jobInfoId, userId);

  if (interviews.length === 0) {
    return redirect(`/app/job-infos/${jobInfoId}/interviews/new`);
  }

  return (
    <Card>
      <CardContent>
        <div>Interviews for job info ID: {jobInfoId}</div>
      </CardContent>
    </Card>
  );
}

async function getInterviews(jobInfoId: string, userId: string) {
  "use cache";
  cacheTag(getInterviewJobInfoTag(jobInfoId));
  cacheTag(getJobInfoIdTag(jobInfoId));

  const data = await db.query.InterviewTable.findMany({
    where: and(
      eq(InterviewTable.jobInfoId, jobInfoId),
      isNotNull(InterviewTable.humeChatId)
    ),
    with: { jobInfo: { columns: { userId: true } } },
    orderBy: desc(InterviewTable.updatedAt),
  });

  return data.filter((interview) => interview.jobInfo.userId === userId);
}
