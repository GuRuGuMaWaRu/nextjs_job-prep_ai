"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useVoice, VoiceReadyState } from "@humeai/voice-react";
import {
  Loader2Icon,
  MicIcon,
  MicOffIcon,
  PhoneCallIcon,
  PhoneOffIcon,
} from "lucide-react";

import { env } from "@/core/data/env/client";
import { Button } from "@/core/components/ui/button";
import { JobInfoTable } from "@/core/drizzle/schema";
import { CondensedMessages } from "@/core/services/hume/components/CondensedMessages";
import { condenseChatMessages } from "@/core/services/hume/lib/condenseChatMessages";
import {
  createInterview,
  updateInterview,
} from "@/core/features/interviews/actions";
import { errorToast, HUME_UNAVAILABLE_MESSAGE } from "@/core/lib/errorToast";

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
  const {
    connect,
    disconnect,
    readyState,
    messages,
    chatMetadata,
    callDurationTimestamp,
  } = useVoice();
  const durationRef = useRef(callDurationTimestamp);
  const [interviewId, setInterviewId] = useState<string | null>(null);

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

  //** This means Hume prevents us from having an interview, so we need to show a toast */
  useEffect(() => {
    if (readyState === VoiceReadyState.CLOSED && !messages.length) {
      errorToast(HUME_UNAVAILABLE_MESSAGE);
    }
  }, [jobInfo.id, messages.length, readyState, router]);

  const handleStartInterview = async () => {
    const res = await createInterview({ jobInfoId: jobInfo.id });

    if (res.error) {
      errorToast(res.message);
      return;
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
  };

  const handleEndInterview = () => {
    disconnect();

    if (interviewId == null) {
      return router.push(`/app/job-infos/${jobInfo.id}/interviews`);
    }

    if (durationRef.current != null) {
      updateInterview(interviewId, { duration: durationRef.current });
    }
    router.push(`/app/job-infos/${jobInfo.id}/interviews/${interviewId}`);
  };

  return (
    <div className="h-full w-full flex flex-col py-4">
      {readyState === VoiceReadyState.CONNECTING ? (
        <Loader2Icon className="animate-spin size-24 self-center m-auto" />
      ) : null}

      <div className="overflow-y-auto flex flex-col mt-auto self-center">
        <Messages user={user} />
        <Controls
          onEndInterview={handleEndInterview}
          onStartInterview={handleStartInterview}
        />
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

function Controls({
  onEndInterview,
  onStartInterview,
}: {
  onEndInterview: () => void;
  onStartInterview: () => void;
}) {
  const { isMuted, mute, unmute, micFft, callDurationTimestamp, readyState } =
    useVoice();

  const beforeInterview =
    readyState === VoiceReadyState.IDLE ||
    readyState === VoiceReadyState.CLOSED;
  const interviewIsActive = readyState === VoiceReadyState.OPEN;

  const handleMuteUnmute = () => {
    if (isMuted) {
      unmute();
    } else {
      mute();
    }
  };

  return (
    <div className="flex gap-5 rounded border px-4 py-2 w-fit sticky bottom-6 bg-background items-center">
      <Button
        variant="ghost"
        size="icon"
        className="-mx-3"
        onClick={onStartInterview}
        disabled={!beforeInterview}>
        <PhoneCallIcon className="size-4 text-primary" />
        <span className="sr-only">Start Interview</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="-mx-3"
        onClick={handleMuteUnmute}
        disabled={!interviewIsActive}>
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
        onClick={onEndInterview}
        disabled={!interviewIsActive}>
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
