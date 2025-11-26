import { Suspense } from "react";
import { Loader2Icon } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser";
import { db } from "@/drizzle/db";
import { JobInfoTable } from "@/drizzle/schema";
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache";
import { Card, CardContent } from "@/components/ui/card";

export default function AppPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen-header flex items-center justify-center">
          <Loader2Icon className="animate-spin size-24" />
        </div>
      }>
      <JobInfos />
    </Suspense>
  );
}

async function JobInfos() {
  const { userId, redirectToSignIn } = await getCurrentUser();
  if (userId == null) return redirectToSignIn();

  const jobInfos = await getJobInfos(userId);

  if (jobInfos.length === 0) {
    return <NoJobInfos />;
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Welcome to the App Page</h1>
      <ul className="space-y-2">
        {jobInfos.map((job: any) => (
          <li key={job.jobId} className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold">{job.title}</h2>
            <p>Job ID: {job.jobId}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NoJobInfos() {
  return (
    <div className="container my-8 max-w-5xl">
      <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4">
        Welcome to Landr
      </h1>
      <p className="text-muted-foreground mb-8">
        To get started, enter information about the type of job you want to
        apply for. This can be specific information copied directly from a job
        listing or general information such as the tech stack you want to work
        in. The more specific you are in the description the closer the test
        interviews will be to the real thing.
      </p>

      <Card className="p-6 border-dashed border-2 border-muted">
        <CardContent>{/* <JobInfoForm /> */}</CardContent>
      </Card>
    </div>
  );
}

async function getJobInfos(userId: string) {
  "use cache";
  cacheTag(getJobInfoIdTag(userId));

  return db.query.JobInfoTable.findMany({
    where: eq(JobInfoTable.userId, userId),
    orderBy: desc(JobInfoTable.updatedAt),
  });
}
