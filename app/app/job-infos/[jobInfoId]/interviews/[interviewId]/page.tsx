import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Loader2Icon } from "lucide-react";

import { BackLink } from "@/core/components/BackLink";
import { getInterviewById } from "@/core/features/interviews/actions";
import { getCurrentUser } from "@/core/services/clerk/lib/getCurrentUser";
import { SuspendedItem } from "@/core/components/SuspendedItem";
import { Skeleton, SkeletonButton } from "@/core/components/Skeleton";
import { formatDateTime } from "@/core/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { MarkdownRenderer } from "@/core/components/MarkdownRenderer";
import { condenseChatMessages } from "@/core/services/hume/lib/condenseChatMessages";
import { CondensedMessages } from "@/core/services/hume/components/CondensedMessages";
import { fetchChatMessages } from "@/core/services/hume/lib/api";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ jobInfoId: string; interviewId: string }>;
}) {
  const { jobInfoId, interviewId } = await params;

  const interview = getCurrentUser().then(
    async ({ userId, redirectToSignIn }) => {
      if (userId == null) return redirectToSignIn();

      const interview = await getInterviewById(interviewId, userId);

      await new Promise((resolve) => setTimeout(resolve, 3000));
      if (interview == null) return notFound();
      return interview;
    }
  );

  return (
    <div className="container my-4 space-y-4">
      <BackLink href={`/app/job-infos/${jobInfoId}/interviews`}>
        Back to Interviews
      </BackLink>

      <div className="space-y-6">
        <div className="flex justify-between gap-2">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl md:text-4xl">
              Interview:{" "}
              <SuspendedItem
                item={interview}
                fallback={<Skeleton className="w-80 h-8" />}
                result={(i) => formatDateTime(i.createdAt)}
              />
            </h1>
            <p className="text-muted-foreground">
              <SuspendedItem
                item={interview}
                fallback={<Skeleton className="w-full h-4" />}
                result={(i) => i.duration}
              />
            </p>
          </div>
          <SuspendedItem
            item={interview}
            fallback={<SkeletonButton className="w-32" />}
            result={(i) =>
              i.feedback == null ? null : ( // TODO: Add a placeholder for the feedback
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>View Feedback</Button>
                  </DialogTrigger>
                  <DialogContent className="md:max-w-3xl lg:max-w-4xl max-h-[calc(100%-2rem)] overflow-y-auto flex flex-col">
                    <DialogTitle>Feedback</DialogTitle>
                    <MarkdownRenderer>{i.feedback}</MarkdownRenderer>
                  </DialogContent>
                </Dialog>
              )
            }
          />
        </div>
        <Suspense
          fallback={<Loader2Icon className="animate-spin size-24 mx-auto" />}>
          <SuspendedMessages interview={interview} />
        </Suspense>
      </div>
    </div>
  );
}

async function SuspendedMessages({
  interview,
}: {
  interview: Promise<{ humeChatId: string | null }>;
}) {
  const { user, redirectToSignIn } = await getCurrentUser({ allData: true });
  if (user == null) return redirectToSignIn();
  const { humeChatId } = await interview;
  if (humeChatId == null) return notFound();

  const condensedMessages = condenseChatMessages(
    await fetchChatMessages(humeChatId)
  );

  return (
    <CondensedMessages
      messages={condensedMessages}
      user={user}
      className="max-w-5xl mx-auto"
    />
  );
}
