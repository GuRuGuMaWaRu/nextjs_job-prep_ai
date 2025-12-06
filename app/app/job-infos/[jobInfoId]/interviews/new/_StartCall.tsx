"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useVoice, VoiceReadyState } from "@humeai/voice-react";
import { Loader2Icon, MicIcon, MicOffIcon, PhoneOffIcon } from "lucide-react";

import { env } from "@/core/data/env/client";
import { Button } from "@/core/components/ui/button";
import { JobInfoTable } from "@/core/drizzle/schema";
import { CondensedMessages } from "@/core/services/hume/components/CondensedMessages";
import { condenseChatMessages } from "@/core/services/hume/lib/condenseChatMessages";
import { createInterview } from "@/core/features/interviews/actions";
import { errorToast } from "@/core/lib/errorToast";
import { updateInterview } from "@/core/features/interviews/actions";
import { useRouter } from "next/navigation";
import { BackLink } from "@/core/components/BackLink";

export function StartCall({
  accessToken,
  jobInfo,
  user,
}: {
  accessToken: string;
  jobInfo: Pick<
    typeof JobInfoTable.$inferSelect,
    "id" | "title" | "description" | "experienceLevel"
  >;
  user: { name: string; image: string };
}) {
  const router = useRouter();

  const { connect, readyState, chatMetadata, callDurationTimestamp } =
    useVoice();
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const durationRef = useRef(callDurationTimestamp);

  //** Sync chat id */
  useEffect(() => {
    if (chatMetadata?.chatId == null || interviewId == null) {
      return;
    }
    updateInterview(interviewId, { humeChatId: chatMetadata.chatId });
  }, [chatMetadata, interviewId]);

  //** Sync chat duration */
  useEffect(() => {
    if (interviewId == null) return;

    const intervalId = setInterval(() => {
      if (durationRef.current == null) return;

      updateInterview(interviewId, {
        duration: durationRef.current,
      });
    }, 10000);

    return () => clearInterval(intervalId);
  }, [interviewId]);

  //** Sync chat duration :: helper */
  useEffect(() => {
    durationRef.current = callDurationTimestamp;
  }, [callDurationTimestamp]);

  //** Handle disconnect */
  useEffect(() => {
    if (readyState !== VoiceReadyState.CLOSED) return;
    if (interviewId == null) {
      return router.push(`/app/job-infos/${jobInfo.id}/interviews`);
    }

    if (durationRef.current != null) {
      updateInterview(interviewId, { duration: durationRef.current });
    }

    router.push(`/app/job-infos/${jobInfo.id}/interviews/${interviewId}`);
  }, [interviewId, jobInfo.id, readyState, router]);

  if (readyState === VoiceReadyState.IDLE) {
    return (
      <div className="h-screen-header container py-4 flex flex-col">
        <BackLink
          href={`/app/job-infos/${jobInfo.id}/interviews`}
          className="self-start">
          Back To Interviews
        </BackLink>
        <Button
          className="w-fit self-center my-auto"
          size="lg"
          onClick={async () => {
            const res = await createInterview({ jobInfoId: jobInfo.id });

            if (res.error) {
              return errorToast(res.message);
            }

            setInterviewId(res.id);

            connect({
              auth: { type: "accessToken", value: accessToken },
              configId: env.NEXT_PUBLIC_HUME_CONFIG_ID,
              sessionSettings: {
                type: "session_settings",
                variables: {
                  userName: user.name,
                  experienceLevel: jobInfo.experienceLevel,
                  title: jobInfo.title || "Not specified",
                  description: jobInfo.description,
                },
              },
            });
          }}>
          Start Interview
        </Button>
      </div>
    );
  }

  if (
    readyState === VoiceReadyState.CONNECTING ||
    readyState === VoiceReadyState.CLOSED
  ) {
    return (
      <div className="h-screen-header flex items-center justify-center">
        <Loader2Icon className="animate-spin size-24" />
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-screen-header flex flex-col-reverse">
      <div className="container py-6 flex flex-col items-center justify-end gap-4">
        <Messages user={user} />
        <Controls />
      </div>
    </div>
  );
}

function Messages({ user }: { user: { name: string; image: string } }) {
  const { messages, fft } = useVoice();

  const condensedMessages = useMemo(() => {
    return condenseChatMessages(messages);
  }, [messages]);

  return (
    <CondensedMessages
      messages={condensedMessages}
      user={user}
      maxFft={Math.max(...fft)}
      className="max-w-5xl"
    />
  );
}

function Controls() {
  const { disconnect, isMuted, mute, unmute, micFft, callDurationTimestamp } =
    useVoice();

  return (
    <div className="flex gap-5 rounded border px-4 py-2 w-fit sticky bottom-6 bg-background items-center">
      <Button
        variant="ghost"
        size="icon"
        className="-mx-3"
        onClick={() => (isMuted ? unmute() : mute())}>
        {isMuted ? <MicOffIcon className="text-destructive" /> : <MicIcon />}
        <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
      </Button>
      <div className="self-stretch">
        <FftVisualizer fft={micFft} />
      </div>
      <div className="text-sm text-muted-foreground tabular-nums">
        {callDurationTimestamp}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="-mx-3"
        onClick={disconnect}>
        <PhoneOffIcon className="text-destructive" />
        <span className="sr-only">End Call</span>
      </Button>
    </div>
  );
}

function FftVisualizer({ fft }: { fft: number[] }) {
  return (
    <div className="flex gap-1 items-center h-full">
      {fft.map((value, index) => {
        const percent = (value / 4) * 100;
        return (
          <div
            key={index}
            className="min-h-0.5 bg-primary/75 w-0.5 rounded"
            style={{ height: `${percent < 10 ? 0 : percent}%` }}
          />
        );
      })}
    </div>
  );
}
