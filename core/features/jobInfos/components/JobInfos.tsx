import Link from "next/link";
import { CircleArrowUpIcon, PlusIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@core/components/ui/card";
import { Button } from "@core/components/ui/button";
import { JobInfoForm } from "@/core/features/jobInfos/components/JobInfoForm";
import { JobInfoCard } from "@/core/features/jobInfos/components/JobInfoCard";
import { getJobInfos } from "@/core/features/jobInfos/actions";
import {
  FREE_PLAN_LIMITS,
  getUserPlan,
} from "@/core/features/auth/permissions";
import { routes } from "@/core/data/routes";

export async function JobInfos() {
  const jobInfos = await getJobInfos();
  const currentPlan = await getUserPlan();

  if (jobInfos.length === 0) {
    return <NoJobInfos currentPlan={currentPlan} />;
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
      <CurrentPlanUpgradeCard plan={currentPlan} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link
          className="transition-opacity hover:[.job-info-card]:opacity-70"
          href={routes.newJobInfo}>
          <Card className="h-full flex items-center justify-center border-dashed border-3 bg-transparent hover:border-primary/50 transition-colors shadow-none">
            <div className="text-lg flex items-center gap-2">
              <PlusIcon className="size-6" />
              New Job Description
            </div>
          </Card>
        </Link>
        {jobInfos.map((jobInfo) => (
          <JobInfoCard key={jobInfo.id} jobInfo={jobInfo} />
        ))}
      </div>
    </div>
  );
}

function NoJobInfos({ currentPlan }: { currentPlan: "free" | "pro" }) {
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

      <div className="mb-8">
        <CurrentPlanUpgradeCard plan={currentPlan} />
      </div>

      <Card className="p-6 border-dashed border-2 border-muted">
        <CardContent>
          <JobInfoForm />
        </CardContent>
      </Card>
    </div>
  );
}

function CurrentPlanUpgradeCard({ plan }: { plan: "free" | "pro" }) {
  const isFreePlan = plan === "free";

  return (
    <Card className="mb-6 w-full gap-4 border-primary/40 bg-linear-to-r from-primary/10 via-primary/5 to-background shadow-md md:gap-6">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
          <CircleArrowUpIcon className="text-primary" />
          Current plan
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          {isFreePlan
            ? "You are on the Free plan. Upgrade for unlimited interviews and questions."
            : "You are on the Pro plan with unlimited interviews and questions."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          {isFreePlan
            ? `Free limits: ${FREE_PLAN_LIMITS.interviews} interview and ${FREE_PLAN_LIMITS.questions} questions per month.`
            : "Resume analysis is available on both plans."}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={routes.upgrade}>
            {isFreePlan ? "Upgrade plan" : "View plan details"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
