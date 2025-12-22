import { Suspense } from "react";
import Link from "next/link";
import { ArrowRightIcon, PlusIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@core/components/ui/card";
import { Button } from "@core/components/ui/button";
import { Badge } from "@core/components/ui/badge";
import { FullScreenLoader } from "@/core/components/FullScreenLoader";
import { JobInfoForm } from "@/core/features/jobInfos/components/JobInfoForm";
import { formatExperienceLevel } from "@/core/features/jobInfos/lib/formatters";
import { getJobInfos } from "@/core/features/jobInfos/actions";
import { getCurrentUser } from "@/core/features/auth/server";
import { routes } from "@/core/data/routes";

export default function AppPage() {
  return (
    <Suspense
      fallback={<FullScreenLoader className="m-auto h-screen-header" />}>
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
    <div className="container my-4">
      <div className="flex gap-2 justify-between mb-6">
        <h1 className="text-3xl md:text-4xl lg:text-5xl">
          Select a job description
        </h1>
        <Button asChild>
          <Link href={routes.newJobInfo}>
            <PlusIcon />
            Create Job Description
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 has-hover:*:not-hover:opacity-70">
        {jobInfos.map((jobInfo) => (
          <Link
            className="hover:scale-[1.02] transition-[transform_opacity]"
            href={routes.jobInfo(jobInfo.id)}
            key={jobInfo.id}>
            <Card className="h-full">
              <div className="flex items-center justify-between h-full">
                <div className="space-y-4 h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{jobInfo.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground line-clamp-3">
                    {jobInfo.description}
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Badge variant="outline">
                      {formatExperienceLevel(jobInfo.experienceLevel)}
                    </Badge>
                    {jobInfo.title && (
                      <Badge variant="outline">{jobInfo.title}</Badge>
                    )}
                  </CardFooter>
                </div>
                <CardContent>
                  <ArrowRightIcon className="size-6" />
                </CardContent>
              </div>
            </Card>
          </Link>
        ))}
        <Link className="transition-opacity" href={routes.newJobInfo}>
          <Card className="h-full flex items-center justify-center border-dashed border-3 bg-transparent hover:border-primary/50 transition-colors shadow-none">
            <div className="text-lg flex items-center gap-2">
              <PlusIcon className="size-6" />
              New Job Description
            </div>
          </Card>
        </Link>
      </div>
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
        <CardContent>
          <JobInfoForm />
        </CardContent>
      </Card>
    </div>
  );
}
