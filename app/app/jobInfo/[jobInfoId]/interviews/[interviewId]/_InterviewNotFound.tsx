import Link from "next/link";

import { Button } from "@/core/components/ui/button";
import { routes } from "@/core/data/routes";

export default async function InterviewNotFound({
  jobInfoId,
}: {
  jobInfoId: string;
}) {
  return (
    <div className="container max-w-5xl flex flex-col items-center justify-center h-screen-header gap-2">
      <p className="text-primary text-2xl font-bold">
        Oh no! There is no such interview registered.
      </p>
      <Button asChild className="mt-2">
        <Link href={routes.interviews(jobInfoId)} replace>
          Go to Interviews
        </Link>
      </Button>
    </div>
  );
}
