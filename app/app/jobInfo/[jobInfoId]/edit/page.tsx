import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/core/components/ui/card";
import { JobInfoBackLink } from "@/core/features/jobInfos/components/JobInfoBackLink";
import { JobInfoForm } from "@/core/features/jobInfos/components/JobInfoForm";
import { getJobInfo } from "@/core/features/jobInfos/actions";
import { getCurrentUser } from "@/core/features/auth/server";
import { dalAssertSuccess } from "@/core/dal/helpers";

export default async function JobInfoEditPage({
  params,
}: {
  params: Promise<{ jobInfoId: string }>;
}) {
  const { jobInfoId } = await params;

  return (
    <div className="container max-w-5xl my-4 space-y-4">
      <JobInfoBackLink jobInfoId={jobInfoId} />
      <h1 className="text-3xl md:text-4xl">Edit Job Description</h1>
      <Card>
        <CardContent>
          <Suspense
            fallback={<Loader2 className="animate-spin size-24 mx-auto" />}>
            <SuspendedForm jobInfoId={jobInfoId} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function SuspendedForm({ jobInfoId }: { jobInfoId: string }) {
  const jobInfo = await getCurrentUser().then(
    async ({ userId, redirectToSignIn }) => {
      if (userId == null) return redirectToSignIn();

      const jobInfo = await dalAssertSuccess(
        await getJobInfo(jobInfoId, userId)
      );
      if (jobInfo == null) return notFound();

      return jobInfo;
    }
  );

  return <JobInfoForm jobInfo={jobInfo} />;
}
