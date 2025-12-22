import { Suspense } from "react";
import Link from "next/link";
import { ArrowRightIcon, Loader2Icon, PlusIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { PlanLimitAlert } from "@/core/components/PlanLimitAlert";
import {
  canCreateInterview,
  getInterviews,
} from "@/core/features/interviews/actions";
import { JobInfoBackLink } from "@/core/features/jobInfos/components/JobInfoBackLink";
import { getCurrentUser } from "@/core/features/auth/server";
import { formatDateTime } from "@/core/lib/formatters";
import { routes } from "@/core/data/routes";
import { dalAssertSuccess } from "@/core/dal/helpers";

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

  const interviews = dalAssertSuccess(await getInterviews(jobInfoId, userId));
  const hasPermissionForInterviews = await canCreateInterview();

  return (
    <div className="space-y-6 w-full">
      <h1 className="text-3xl md:text-4xl lg:text-5xl">Interviews</h1>

      {!hasPermissionForInterviews ? (
        <PlanLimitAlert hasRedirectButton={true} />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 has-hover:*:not-hover:opacity-70">
        <PermissionCheckedLink
          className="transition-opacity"
          href={routes.newInterview(jobInfoId)}>
          <Card className="h-full flex items-center justify-center border-dashed border-3 bg-transparent hover:border-primary/50 transition-colors shadow-none">
            <div className="text-lg flex items-center gap-2">
              <PlusIcon className="size-6" />
              New Interview
            </div>
          </Card>
        </PermissionCheckedLink>

        {interviews.map((interview) => {
          const match = interview.feedback?.match(
            /Overall Rating:\s*(\d+)\/10/i
          );
          const rating = match ? Number(match[1]) : 0;

          return (
            <Link
              className="hover:scale-[1.02] transition-[transform_opacity]"
              href={routes.interview(jobInfoId, interview.id)}
              key={interview.id}>
              <Card className="h-full">
                <div className="flex items-center justify-between h-full">
                  <CardHeader className="gap-1 grow">
                    <CardTitle className="text-lg flex gap-4">
                      {formatDateTime(interview.createdAt)}
                      <Badge
                        variant={
                          interview.feedback ? "primary" : "destructive"
                        }>
                        {interview.feedback
                          ? `With feedback - ${rating}/10`
                          : "No feedback"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{interview.duration}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ArrowRightIcon className="size-6" />
                  </CardContent>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
