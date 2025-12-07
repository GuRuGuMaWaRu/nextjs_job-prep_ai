import { Suspense } from "react";
import Link from "next/link";
import { cacheTag } from "next/cache";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { ArrowRightIcon, Loader2Icon, PlusIcon } from "lucide-react";

import { db } from "@/core/drizzle/db";
import { InterviewTable } from "@/core/drizzle/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { PlanLimitAlert } from "@/core/components/PlanLimitAlert";
import { getInterviewJobInfoTag } from "@/core/features/interviews/dbCache";
import { canCreateInterview } from "@/core/features/interviews/actions";
import { getJobInfoIdTag } from "@/core/features/jobInfos/dbCache";
import { JobInfoBackLink } from "@/core/features/jobInfos/components/JobInfoBackLink";
import { getCurrentUser } from "@/core/services/clerk/lib/getCurrentUser";
import { formatDateTime } from "@/core/lib/formatters";

import { PermissionCheckedLink } from "./_PermissionCheckedLink";

export default async function InterviewsPage({
  params,
}: {
  params: Promise<{ jobInfoId: string }>;
}) {
  const { jobInfoId } = await params;

  return (
    <div className="container max-w-5xl my-4 space-y-4">
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
  const hasPermissionForInterviews = await canCreateInterview();

  return (
    <div className="space-y-6 w-full">
      <div className="flex gap-2 justify-between">
        <h1 className="text-3xl md:text-4xl lg:text-5xl">Interviews</h1>
        <Button asChild>
          <PermissionCheckedLink
            href={`/app/job-infos/${jobInfoId}/interviews/new`}>
            <PlusIcon />
            New Interview
          </PermissionCheckedLink>
        </Button>
      </div>

      {!hasPermissionForInterviews ? (
        <PlanLimitAlert hasRedirectButton={true} />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 has-hover:*:not-hover:opacity-70">
        {hasPermissionForInterviews ? (
          <PermissionCheckedLink
            className="transition-opacity"
            href={`/app/job-infos/${jobInfoId}/interviews/new`}>
            <Card className="h-full flex items-center justify-center border-dashed border-3 bg-transparent hover:border-primary/50 transition-colors shadow-none">
              <div className="text-lg flex items-center gap-2">
                <PlusIcon className="size-6" />
                New Interview
              </div>
            </Card>
          </PermissionCheckedLink>
        ) : null}

        {interviews.map((interview) => (
          <Link
            className="hover:scale-[1.02] transition-[transform_opacity]"
            href={`/app/job-infos/${jobInfoId}/interviews/${interview.id}`}
            key={interview.id}>
            <Card className="h-full">
              <div className="flex items-center justify-between h-full">
                <CardHeader className="gap-1 grow">
                  <CardTitle className="text-lg">
                    {formatDateTime(interview.createdAt)}
                  </CardTitle>
                  <CardDescription>{interview.duration}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ArrowRightIcon className="size-6" />
                </CardContent>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
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
