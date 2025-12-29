import Link from "next/link";
import { ArrowRightIcon, TrashIcon } from "lucide-react";

import { Badge } from "@/core/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { ActionButton } from "@/core/components/ui/action-button";
import { formatExperienceLevel } from "@/core/features/jobInfos/lib/formatters";
import { removeJobInfoAction } from "@/core/features/jobInfos/actions";
import { JobInfoTable } from "@/core/drizzle/schema";
import { routes } from "@/core/data/routes";

export function JobInfoCard({
  jobInfo,
}: {
  jobInfo: typeof JobInfoTable.$inferSelect;
}) {
  return (
    <div className="job-info-card" key={jobInfo.id}>
      <Card className="p-0 h-[200px] transition-[opacity_colors] has-[.delete-button:hover]:outline-destructive/70! has-[.delete-button:hover]:outline-4! has-[.link-button:hover]:outline-primary/70! has-[.link-button:hover]:outline-4! has-[.delete-button:hover]:bg-destructive/10! has-[.link-button:hover]:bg-primary/10! ">
        <div className="flex justify-between h-full">
          <div className="flex flex-col h-full py-4">
            <CardHeader>
              <CardTitle>{jobInfo.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground line-clamp-3">
              {jobInfo.description}
            </CardContent>
            <CardFooter className="flex gap-2 mt-auto">
              <Badge variant="outline">
                {formatExperienceLevel(jobInfo.experienceLevel)}
              </Badge>
              {jobInfo.title && (
                <Badge variant="outline">{jobInfo.title}</Badge>
              )}
            </CardFooter>
          </div>
          <CardContent className="border-l-2 self-stretch p-0 basis-24 shrink-0 cursor-pointer">
            <Button
              asChild
              variant="ghost"
              className="w-full h-1/2 link-button">
              <Link
                href={routes.jobInfo(jobInfo.id)}
                className="flex items-center justify-center h-1/2 border-b-2 link-button transition-colors hover:bg-accent! dark:hover:bg-accent/50!">
                <ArrowRightIcon className="size-6 " />
              </Link>
            </Button>
            <ActionButton
              action={removeJobInfoAction.bind(null, jobInfo.id)}
              requireAreYouSure
              areYouSureDescription="Deleting this Job Info will also remove all related interviews and questions."
              successMessage={`Job info for "${jobInfo.name}" removed successfully`}
              className="w-full h-1/2 delete-button"
              variant="ghost">
              <TrashIcon className="size-4 text-destructive" />
            </ActionButton>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}

export default JobInfoCard;
