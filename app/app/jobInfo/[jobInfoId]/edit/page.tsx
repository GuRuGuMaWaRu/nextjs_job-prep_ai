import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/core/components/ui/card";
import { JobInfoBackLink } from "@/core/features/jobInfos/components/JobInfoBackLink";
import { JobInfoForm } from "@/core/features/jobInfos/components/JobInfoForm";
import { getJobInfoAction } from "@/core/features/jobInfos/actions";
import { getCurrentUser } from "@/core/lib/getCurrentUser";
import { routes } from "@/core/data/routes";

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
  const jobInfo = await getCurrentUser().then(async (user) => {
    if (user == null) {
      return redirect(routes.signIn);
    }

    const jobInfo = await getJobInfoAction(jobInfoId); //** TODO: ot this could be getJobInfoAction that requires the user and redirects to Sign In internally, but then does this redirect to NotFound in the page body?*/
    if (jobInfo == null) {
      return notFound();
    }

    return jobInfo;
  });

  return <JobInfoForm jobInfo={jobInfo} />;
}
